import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { env } from "~/env";
import Stripe from "stripe";
import { TRPCError } from "@trpc/server";

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export const stripeRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        projectIdeaId: z.string().cuid("Invalid Project Idea ID"),
        amount: z.number().int().min(50, "Amount must be at least $0.50 (50 cents)"), // Stripe has minimum charge amounts
        // For simplicity, currency is hardcoded to USD. Could be an input if needed.
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { projectIdeaId, amount } = input;

      try {
        // 1. Fetch the project idea to ensure it exists and to get its title/description
        const projectIdea = await ctx.db.projectIdea.findUnique({
          where: { id: projectIdeaId },
        });

        if (!projectIdea) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Project idea not found.",
          });
        }

        if (projectIdea.status !== "CROWDFUNDING") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "This project is not currently accepting pledges.",
          });
        }

        // Ensure the user is not pledging to their own project (optional business rule)
        if (projectIdea.userId === userId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot pledge to your own project idea.",
          });
        }

        // Ensure user does not already have an active pledge for this project
        // (This might be better handled by allowing pledge updates, but for now, prevent duplicates)
        const existingPledge = await ctx.db.pledge.findUnique({
            where: { userId_projectIdeaId: { userId, projectIdeaId } },
        });
        if (existingPledge) {
            throw new TRPCError({
                code: "BAD_REQUEST",
                message: "You have already pledged to this project. Manage your existing pledge instead.",
            });
        }


        const appDomain = env.NEXT_PUBLIC_APP_DOMAIN.startsWith("http")
          ? env.NEXT_PUBLIC_APP_DOMAIN
          : `https://${env.NEXT_PUBLIC_APP_DOMAIN}`;

        const successUrl = `${appDomain}/project/${projectIdeaId}?payment_status=success&session_id={CHECKOUT_SESSION_ID}`;
        const cancelUrl = `${appDomain}/project/${projectIdeaId}?payment_status=cancelled`;

        // 2. Create a Stripe Checkout session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: `Pledge for: ${projectIdea.title}`,
                  description: `Supporting project idea: ${projectIdea.description.substring(0, 100)}...`,
                  // images: [projectIdea.coverImagePath] // If you have one
                },
                unit_amount: amount, // Amount in cents
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: successUrl,
          cancel_url: cancelUrl,
          metadata: {
            userId,
            projectIdeaId,
            amountPledged: amount.toString(), // Stripe metadata values must be strings
          },
          // Optionally, collect user's email if not already available or to prefill
          // customer_email: ctx.session.user.email || undefined,
        });

        if (!session.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create Stripe checkout session.",
          });
        }

        return {
          checkoutUrl: session.url,
          sessionId: session.id, // Return session ID for potential client-side use
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("Stripe Checkout Session Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session.",
          cause: error,
        });
      }
    }),
});
