import { NextResponse } from "next/server";
import { db } from "@/server/db";
import Stripe from "stripe";
import type { Readable } from "node:stream";

// Initialize Stripe with the secret key
// Ensure STRIPE_SECRET_KEY is set in your environment variables
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-08-23", // Use the latest API version
  typescript: true,
});

// Helper function to buffer the request stream
async function buffer(readable: Readable): Promise<Buffer> {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export async function POST(req: Request) {
  const rawBody = await buffer(req.body as unknown as Readable);
  const sig = req.headers.get("stripe-signature");

  // Ensure STRIPE_WEBHOOK_SECRET is set in your environment variables
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Stripe webhook error: Missing signature or webhook secret.");
    return NextResponse.json(
      { error: "Webhook signature or secret missing." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`Stripe webhook signature error: ${err.message}`);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeSessionId = session.id;
      // Assuming client_reference_id was used to store donationId.
      // If not, you might need to query by stripeSessionId if it's unique on Donation.
      // const donationId = session.client_reference_id;

      try {
        const donation = await db.donation.findUnique({
          where: { stripeSessionId },
        });

        if (donation && donation.status === "pending") {
          await db.$transaction(async (tx) => {
            await tx.donation.update({
              where: { id: donation.id },
              data: { status: "succeeded" },
            });

            await tx.artifact.update({
              where: { id: donation.artifactId },
              data: {
                currentFunding: {
                  increment: donation.amount,
                },
              },
            });
          });
          console.log(`Donation ${donation.id} succeeded and artifact currentFunding updated.`);
        } else if (donation) {
          console.log(`Donation ${donation.id} already processed or not in pending state. Status: ${donation.status}`);
        } else {
          console.warn(`Donation with stripeSessionId ${stripeSessionId} not found.`);
        }
      } catch (error) {
        console.error("Error processing successful checkout session:", error);
        return NextResponse.json(
          { error: "Internal server error while updating donation." },
          { status: 500 }
        );
      }
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeSessionId = session.id;
      // const donationId = session.client_reference_id;

      try {
        const donation = await db.donation.findUnique({
          where: { stripeSessionId },
        });

        if (donation && donation.status === "pending") {
          await db.donation.update({
            where: { id: donation.id },
            data: { status: "failed" },
          });
          console.log(`Donation ${donation.id} status updated to failed.`);
        } else if (donation) {
          console.log(`Donation ${donation.id} already processed or not in pending state. Status: ${donation.status}`);
        } else {
          console.warn(`Donation with stripeSessionId ${stripeSessionId} not found for failure event.`);
        }
      } catch (error) {
        console.error("Error processing failed checkout session:", error);
        return NextResponse.json(
          { error: "Internal server error while updating donation to failed." },
          { status: 500 }
        );
      }
      break;
    }

    // Add other event types as needed
    // default:
    //   console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
