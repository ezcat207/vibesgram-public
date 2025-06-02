import { headers } from "next/headers";
import { NextResponse } from "next/server";
import Stripe from "stripe";
import { env } from "~/env";
import { db } from "~/server/db"; // Assuming db export from server/db.ts

const stripe = new Stripe(env.STRIPE_SECRET_KEY);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing Stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(` Stripe webhook signature verification failed: ${errorMessage}`);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const { userId, projectIdeaId, amountPledged } = session.metadata || {};
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

    if (!userId || !projectIdeaId || !amountPledged || !paymentIntentId) {
      console.error("Stripe webhook - Missing metadata or paymentIntentId from session:", session);
      return NextResponse.json({ error: "Missing required metadata or paymentIntentId from Stripe session" }, { status: 400 });
    }

    const amountPledgedNum = parseInt(amountPledged, 10);
    if (isNaN(amountPledgedNum)) {
      console.error("Stripe webhook - Invalid amountPledged in metadata:", amountPledged);
      return NextResponse.json({ error: "Invalid amountPledged in metadata" }, { status: 400 });
    }

    try {
      // Use a transaction to ensure atomicity
      await db.$transaction(async (prisma) => {
        // 1. Create the Pledge record
        // Check if pledge already exists (idempotency for retries from Stripe)
        const existingPledge = await prisma.pledge.findUnique({
          where: { paymentIntentId },
        });

        if (existingPledge) {
          console.log(`Pledge with paymentIntentId ${paymentIntentId} already exists. Skipping creation.`);
          // Potentially re-check project status if needed, or just acknowledge
        } else {
          await prisma.pledge.create({
            data: {
              amount: amountPledgedNum,
              userId,
              projectIdeaId,
              paymentIntentId,
            },
          });
          console.log(`Pledge created for userId: ${userId}, projectIdeaId: ${projectIdeaId}, amount: ${amountPledgedNum}`);
        }

        // 2. Check if project is now funded
        const project = await prisma.projectIdea.findUnique({
          where: { id: projectIdeaId },
          include: { pledges: true },
        });

        if (!project) {
          // This should ideally not happen if session metadata was correct
          console.error(`ProjectIdea with ID ${projectIdeaId} not found during webhook processing.`);
          throw new Error(`ProjectIdea ${projectIdeaId} not found.`);
        }

        // Only update to FUNDED if it's currently CROWDFUNDING
        if (project.status === "CROWDFUNDING") {
          const totalPledged = project.pledges.reduce((sum, p) => sum + p.amount, 0)
                               + (existingPledge ? 0 : amountPledgedNum); // Add current pledge if it wasn't already counted

          if (totalPledged >= project.targetPrice) {
            await prisma.projectIdea.update({
              where: { id: projectIdeaId },
              data: { status: "FUNDED" },
            });
            console.log(`Project ${projectIdeaId} has been successfully funded.`);
            // TODO: Trigger notifications for successful funding (out of scope for this step)
          }
        }
      });

    } catch (dbError) {
      const errorMessage = dbError instanceof Error ? dbError.message : "Unknown database error";
      console.error(`Stripe webhook - Database error: ${errorMessage}`, dbError);
      return NextResponse.json({ error: `Database processing error: ${errorMessage}` }, { status: 500 });
    }
  } else {
    console.log(`Stripe webhook - Received unhandled event type: ${event.type}`);
    // Optionally handle other event types
  }

  return NextResponse.json({ received: true });
}

// It's good practice to also define a GET handler for webhooks if needed,
// though Stripe primarily uses POST. Some webhook systems might do a GET for verification.
export async function GET() {
  return NextResponse.json({ message: "Stripe webhook endpoint. Use POST for events." });
}
