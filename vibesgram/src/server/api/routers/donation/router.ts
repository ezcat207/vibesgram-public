import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  // publicProcedure, // Assuming protected for now
} from "../../trpc";
import { db } from "../../../db";
import {
  createDonationSchema,
  getDonationsSchema,
} from "../artifact/schema"; // Adjust path as necessary

export const donationRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createDonationSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { artifactId, amount } = input;

      // In a real scenario, initiate Stripe payment here and use the Stripe session ID.
      // For now, we use a placeholder.
      const placeholderStripeSessionId =
        `placeholder_stripe_session_id_${new Date().getTime()}`;

      const newDonation = await db.donation.create({
        data: {
          userId,
          artifactId,
          amount,
          stripeSessionId: placeholderStripeSessionId,
          status: "pending", // Initial status
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return newDonation;
    }),

  getDonationsByArtifact: protectedProcedure // Or publicProcedure if donations can be viewed by anyone
    .input(getDonationsSchema)
    .query(async ({ ctx, input }) => {
      const { artifactId, limit, cursor } = input;

      const donations = await db.donation.findMany({
        where: {
          artifactId,
          status: "succeeded", // Typically, only show successful donations
        },
        take: limit + 1, // Fetch one extra item to determine if there's a next page
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc", // Show newest donations first
        },
        include: {
          user: {
            // Select specific fields from the user to avoid exposing sensitive data
            select: {
              id: true,
              name: true,
              image: true,
              username: true,
            },
          },
        },
      });

      let nextCursor: typeof cursor | undefined = undefined;
      if (donations.length > limit) {
        const nextItem = donations.pop(); // Remove the extra item
        nextCursor = nextItem!.id;
      }

      return {
        items: donations,
        nextCursor,
      };
    }),
});
