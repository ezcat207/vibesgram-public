import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2022-11-15",
});

export const paymentRouter = createTRPCRouter({
  createStripeCheckoutSession: publicProcedure
    .input(z.object({
      artifactId: z.string(),
      amount: z.number().int().min(1), // 单位：美元
    }))
    .mutation(async ({ input }) => {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "Vibesgram 众筹打赏",
                description: `支持项目ID: ${input.artifactId}`,
              },
              unit_amount: input.amount * 100, // 美元转为分
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        metadata: {
          artifactId: input.artifactId,
        },
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/a/${input.artifactId}?pay=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/a/${input.artifactId}?pay=cancel`,
      });
      return { url: session.url };
    }),
}); 