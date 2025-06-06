import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { db } from "@/server/db"; // Prisma client
import { env } from "@/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage as string}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const { userId, artifactId } = session.metadata;
        const amountTotal = session.amount_total; // Amount in cents
        const currency = session.currency;

        if (!userId || !artifactId || amountTotal === null || !currency) {
          console.error("Webhook Error: Missing metadata or amount_total/currency from session.", session.id);
          return NextResponse.json({ error: "Missing metadata or amount." }, { status: 400 });
        }

        try {
          await db.donation.create({
            data: {
              amount: amountTotal, // Store in cents
              currency: currency.toUpperCase(),
              status: "succeeded",
              stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : '', // Ensure it's a string
              userId,
              artifactId,
            },
          });
          console.log(`Donation successful for user ${userId} to artifact ${artifactId}, amount: ${amountTotal} ${currency}`);
        } catch (dbError) {
          console.error("Webhook DB Error:", dbError as string);
          return NextResponse.json({ error: "Database error while creating donation." as string }, { status: 500 });
        }
      }
      break;
    // ... handle other event types if needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
