import { NextRequest, NextResponse } from "next/server";
import { buffer } from "micro";
import Stripe from "stripe";
import { db } from "@/server/db";

// 你的 Stripe Secret Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.arrayBuffer();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      Buffer.from(rawBody),
      sig!,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    // 通过 metadata 传递 artifactId
    const artifactId = session.metadata?.artifactId;
    const amount = session.amount_total ? session.amount_total / 100 : 0;
    if (artifactId && amount > 0) {
      await db.artifact.update({
        where: { id: artifactId },
        data: {
          crowdfundingRaised: { increment: amount },
        },
      });
    }
  }

  return new NextResponse("success", { status: 200 });
} 