import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { env } from "@/env"; // Assuming you have an env loader

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16", // Use a recent API version
});

export const donationRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        artifactId: z.string(),
        amount: z.number().min(1, "Amount must be at least 1"), // Assuming amount is in dollars/euros etc. Stripe expects cents.
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { artifactId, amount } = input;
      const userId = ctx.session.user.id;

      const artifact = await ctx.db.artifact.findUnique({
        where: { id: artifactId },
      });

      if (!artifact) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Artifact not found.",
        });
      }

      // Amount in cents
      const amountInCents = Math.round(amount * 100);
      if (amountInCents < 100) { // Minimum 1 unit of currency (e.g., $1.00)
         throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Donation amount must be at least 1.00.",
        });
      }

      try {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "usd", // Or your desired currency
                product_data: {
                  name: `Donation for ${artifact.title}`,
                  images: artifact.coverImagePath ? [artifact.coverImagePath] : undefined,
                },
                unit_amount: amountInCents,
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${env.NEXTAUTH_URL}/a/${artifactId}?donation=success`, // Adjust URL as needed
          cancel_url: `${env.NEXTAUTH_URL}/a/${artifactId}?donation=cancelled`,  // Adjust URL as needed
          metadata: {
            userId,
            artifactId,
          },
        });

        if (!session.url) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Could not create Stripe checkout session.",
          });
        }

        return { sessionId: session.id, url: session.url };
      } catch (error) {
        console.error("Stripe API Error:", error);
        let message = "Could not create Stripe checkout session.";
        if (error instanceof Stripe.errors.StripeError) {
            message = (error as Stripe.StripeError).message;
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message,
        });
      }
    }),
});
