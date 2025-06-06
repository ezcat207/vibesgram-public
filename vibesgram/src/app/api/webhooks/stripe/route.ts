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
  const signatureHeader = headers().get("stripe-signature");

  if (!signatureHeader) {
    console.error("Webhook Error: Missing stripe-signature header.");
    return NextResponse.json({ error: "Webhook Error: Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signatureHeader, // Use the checked header
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error during webhook construction.";
    console.error(`Webhook signature verification failed: ${errorMessage}`, err); // Log the full error object too
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const { userId, artifactId } = session.metadata || {}; // Add default empty object for metadata
        const amountTotal = session.amount_total; // Amount in cents
        const currency = session.currency;

        if (!userId || !artifactId || amountTotal === null || !currency) {
          console.error("Webhook Error: Missing metadata (userId, artifactId) or amount_total/currency from session.", session.id);
          return NextResponse.json({ error: "Missing critical information in session data." }, { status: 400 });
        }

        try {
          await db.donation.create({
            data: {
              amount: amountTotal, // Store in cents
              currency: currency.toUpperCase(),
              status: "succeeded",
              // Ensure payment_intent is a string, can be null if not expanded or not applicable
              stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : `pi_unknown_${session.id}`,
              userId,
              artifactId,
            },
          });
          console.log(`Donation successful for user ${userId} to artifact ${artifactId}, amount: ${amountTotal} ${currency}`);
        } catch (dbError) {
          const dbErrorMessage = dbError instanceof Error ? dbError.message : "Unknown database error.";
          console.error("Webhook DB Error:", dbErrorMessage, dbError);
          return NextResponse.json({ error: `Database error while creating donation: ${dbErrorMessage}` }, { status: 500 });
        }
      }
      break;
    // ... handle other event types if needed
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
