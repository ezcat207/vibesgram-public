import { describe, it, expect, vi, beforeEach } from 'vitest';
import { appRouter } from '~/server/api/root';
import { createInnerTRPCContext } from '~/server/api/trpc';
import { type DeepMockProxy, mockDeep, mockReset } from 'vitest-mock-extended';
import { PrismaClient, ProjectStatus, Pledge } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import Stripe from 'stripe';
import { env } from '~/env';

// Mock Prisma client
const prismaMock = mockDeep<PrismaClient>();
vi.mock('~/server/db', () => ({
  db: prismaMock,
}));

// Mock Stripe SDK
const mockStripeCheckoutSessionCreate = vi.fn();
vi.mock('stripe', () => {
  // Actual Stripe constructor for type inference, but methods are mocked.
  const OriginalStripe = vi.importActual<typeof Stripe>('stripe');
  return {
    default: vi.fn().mockImplementation(() => ({
      checkout: {
        sessions: {
          create: mockStripeCheckoutSessionCreate,
        },
      },
      // Mock other Stripe methods if needed by other procedures
    })),
    Stripe: OriginalStripe, // Export actual Stripe class for type hints if needed elsewhere
  };
});


describe('Stripe Router', () => {
  const mockSession = {
    user: { id: 'user123', name: 'Test User', email: 'test@example.com', image: null, username: 'testuser' },
    expires: new Date().toISOString(),
  };
  const ctx = createInnerTRPCContext({ session: mockSession });
  const caller = appRouter.createCaller(ctx);

  beforeEach(() => {
    mockReset(prismaMock);
    mockStripeCheckoutSessionCreate.mockReset();
    // Reset env vars if they were modified for specific tests (not typical for these)
    env.NEXT_PUBLIC_APP_DOMAIN = 'testapp.com'; // Ensure a default for URLs
  });

  describe('stripe.createCheckoutSession', () => {
    const projectIdeaId = 'project1';
    const inputAmount = 500; // $5.00

    it('should create a Stripe checkout session for a valid pledge', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId,
        title: 'Test Project',
        description: 'A great project',
        status: ProjectStatus.CROWDFUNDING,
        userId: 'ownerUser1', // Not the current user
        // ... other necessary fields
      } as any);
      prismaMock.pledge.findUnique.mockResolvedValue(null); // No existing pledge

      const mockStripeSession = {
        id: 'sess_12345',
        url: 'https://checkout.stripe.com/pay/sess_12345',
      };
      mockStripeCheckoutSessionCreate.mockResolvedValue(mockStripeSession);

      const result = await caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount });

      expect(result.checkoutUrl).toBe(mockStripeSession.url);
      expect(result.sessionId).toBe(mockStripeSession.id);
      expect(mockStripeCheckoutSessionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          line_items: [
            expect.objectContaining({
              price_data: expect.objectContaining({
                currency: 'usd',
                unit_amount: inputAmount,
                product_data: expect.objectContaining({
                  name: 'Pledge for: Test Project',
                }),
              }),
              quantity: 1,
            }),
          ],
          mode: 'payment',
          success_url: `https://${env.NEXT_PUBLIC_APP_DOMAIN}/project/${projectIdeaId}?payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `https://${env.NEXT_PUBLIC_APP_DOMAIN}/project/${projectIdeaId}?payment_status=cancelled`,
          metadata: {
            userId: mockSession.user.id,
            projectIdeaId,
            amountPledged: inputAmount.toString(),
          },
        })
      );
    });

    it('should throw TRPCError if project is not found', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue(null);

      await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
        .rejects.toThrowError(TRPCError);
      await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
        .rejects.toHaveProperty('code', 'NOT_FOUND');
    });

    it('should throw TRPCError if project is not CROWDFUNDING', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId, status: ProjectStatus.FUNDED, userId: 'owner1'
      } as any);
      prismaMock.pledge.findUnique.mockResolvedValue(null);

      await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
        .rejects.toThrowError(TRPCError);
      await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
        .rejects.toHaveProperty('code', 'BAD_REQUEST');
    });

    it('should throw TRPCError if user pledges to their own project', async () => {
      prismaMock.projectIdea.findUnique.mockResolvedValue({
        id: projectIdeaId, status: ProjectStatus.CROWDFUNDING, userId: mockSession.user.id // Same user
      } as any);
      prismaMock.pledge.findUnique.mockResolvedValue(null);

      await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
        .rejects.toThrowError(TRPCError);
      await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
        .rejects.toHaveProperty('code', 'BAD_REQUEST');
    });

    it('should throw TRPCError if user already has an active pledge for this project', async () => {
        prismaMock.projectIdea.findUnique.mockResolvedValue({
            id: projectIdeaId, status: ProjectStatus.CROWDFUNDING, userId: 'owner1'
        } as any);
        prismaMock.pledge.findUnique.mockResolvedValue({ id: 'pledge1' } as Pledge); // Existing pledge

        await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
            .rejects.toThrowError(TRPCError);
        await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
            .rejects.toHaveProperty('code', 'BAD_REQUEST');
    });

    it('should throw TRPCError if Stripe session creation fails (no URL)', async () => {
        prismaMock.projectIdea.findUnique.mockResolvedValue({
            id: projectIdeaId, title: 'Test Project', description: 'A great project',
            status: ProjectStatus.CROWDFUNDING, userId: 'ownerUser1',
        } as any);
        prismaMock.pledge.findUnique.mockResolvedValue(null);
        mockStripeCheckoutSessionCreate.mockResolvedValue({ id: 'sess_123', url: null }); // No URL

        await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
            .rejects.toThrowError(TRPCError);
        await expect(caller.stripe.createCheckoutSession({ projectIdeaId, amount: inputAmount }))
            .rejects.toHaveProperty('code', 'INTERNAL_SERVER_ERROR');
    });
  });
});

// Conceptual tests for Stripe Webhook Handler (would be in a different test file, e.g., webhook.test.ts using API route testing tools)
// describe('Stripe Webhook Handler (/api/stripe/webhook)', () => {
//   const mockStripeEventConstruct = vi.spyOn(Stripe.prototype.webhooks, 'constructEvent');
//
//   beforeEach(() => {
//     mockReset(prismaMock);
//     mockStripeEventConstruct.mockReset();
//     env.STRIPE_WEBHOOK_SECRET = 'whsec_testsecret';
//   });
//
//   it('should create a pledge and update project to FUNDED on checkout.session.completed', async () => {
//     const mockSessionCompletedEvent = { /* ... Stripe.Event for checkout.session.completed ... */ };
//     mockSessionCompletedEvent.type = 'checkout.session.completed';
//     mockSessionCompletedEvent.data = {
//       object: {
//         id: 'sess_test1',
//         payment_intent: 'pi_test1',
//         metadata: { userId: 'user1', projectIdeaId: 'project1', amountPledged: '1000' },
//       } as Stripe.Checkout.Session,
//     };
//     mockStripeEventConstruct.mockReturnValue(mockSessionCompletedEvent as Stripe.Event);
//
//     prismaMock.pledge.findUnique.mockResolvedValue(null); // No existing pledge
//     prismaMock.projectIdea.findUnique.mockResolvedValue({
//       id: 'project1', status: ProjectStatus.CROWDFUNDING, targetPrice: 1000, pledges: []
//     } as any);
//     prismaMock.projectIdea.update.mockResolvedValue({ status: ProjectStatus.FUNDED } as any);
//     prismaMock.pledge.create.mockResolvedValue({} as Pledge);
//
//     // Simulate POST request to /api/stripe/webhook
//     // const { req, res } = createMocks({ method: 'POST', body: 'raw_event_body', headers: { 'stripe-signature': 'valid_sig' } });
//     // await stripeWebhookHandler(req, res); // Assuming handler is exported
//
//     // expect(res._getStatusCode()).toBe(200);
//     // expect(prismaMock.pledge.create).toHaveBeenCalledTimes(1);
//     // expect(prismaMock.projectIdea.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: ProjectStatus.FUNDED } }));
//   });
//
//   it('should return 400 if signature verification fails', async () => {
//       mockStripeEventConstruct.mockImplementation(() => { throw new Error("Signature verification failed"); });
//       // Simulate POST request with invalid signature
//       // ...
//       // expect(res._getStatusCode()).toBe(400);
//   });
//
//   // More tests: missing metadata, already existing pledge (idempotency), project not found, etc.
// });
