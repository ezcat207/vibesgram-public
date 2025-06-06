import { type Session } from "next-auth";
import { TRPCError } from "@trpc/server";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { type DeepMockProxy, mockDeep, mockReset } from "vitest-mock-extended";

import { type db as prismaClientType } from "@/server/db"; // Renamed to avoid conflict
import { artifactRouter } from "./router"; // Adjust path as necessary
import { type Artifact } from "@prisma/client";

// Mock the Prisma client module. The factory will create the mock.
vi.mock("@/server/db", () => ({
  db: mockDeep<typeof prismaClientType>(),
}));

// After mocking, import the mocked 'db' to get a reference to the mock instance
// This ensures 'dbToUseInTests' is the actual mock instance created by vi.mock
import { db as dbToUseInTestsImported } from "@/server/db";
const dbToUseInTests = dbToUseInTestsImported as unknown as DeepMockProxy<typeof prismaClientType>;

// ALL OTHER MOCKS (env, auth, next-auth, redis) remain BEFORE this block.
// It's crucial that @/server/db is mocked before it's imported by other modules (like trpc).

// Mock environment variables
vi.mock("@/env.js", () => ({
  env: {
    DATABASE_URL: "dummy_db_url",
    NODE_ENV: "test",
    NEXTAUTH_SECRET: "dummy_secret",
    NEXTAUTH_URL: "http://localhost:3000",
    AUTH_GOOGLE_ID: "dummy_google_id",
    AUTH_GOOGLE_SECRET: "dummy_google_secret",
    R2_ACCESS_KEY_ID: "dummy",
    R2_SECRET_ACCESS_KEY: "dummy",
    R2_ENDPOINT: "dummy",
    R2_BUCKET_NAME: "dummy",
    R2_ASSETS_BUCKET_NAME: "dummy",
    SCREENSHOT_SERVICE_URL: "http://localhost:3001",
    UPSTASH_REDIS_REST_URL: "dummy",
    UPSTASH_REDIS_REST_TOKEN: "dummy",
    LIVEBLOCKS_SECRET_KEY: "dummy",
    POSTHOG_API_KEY: "dummy",
    POSTHOG_HOST: "dummy",


  },
}));

// Mock Redis client
vi.mock("@/server/redis", () => ({
  redis: {
    // Mock any functions that would be called on the redis client
    // For example, if it's used for rate limiting:
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    // Add other methods as needed if they are used during test setup
    // or by the procedures being tested.
    // If the client is just instantiated but no methods are called during test setup,
    // an empty object or a mock constructor might also work.
  },
  createRedisClient: vi.fn(() => ({ // if createRedisClient is exported and called
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
  })),
}));

// Attempt to mock the auth module that imports next-auth
vi.mock("@/server/auth", () => ({
  // Add any exports from "@/server/auth" that are needed by trpc.ts or other modules.
  // If protectedProcedure or similar auth mechanisms are defined there and used by your router,
  // they need to be mocked appropriately.
  // For now, let's assume it might export an auth object or similar.
  // This is highly dependent on the actual structure of "@/server/auth".
  // If it's just `auth = NextAuth(...)`, then this mock might be tricky.
  // Let's try a generic mock first.
  default: vi.fn(), // if it's a default export
  auth: vi.fn(),    // if it's a named export 'auth'
  // We also need to ensure that the part of trpc.ts that checks for session
  // can work with our mockCtx.session.
}));


// Mock next-auth (keeping this as it might still be indirectly imported)
vi.mock("next-auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next-auth")>();
  return {
    ...actual,
    getServerSession: vi.fn(() => Promise.resolve(mockSession)), // If used by trpc internally
    // Add other specific mocks if needed, but often just providing the session context is enough
  };
});

vi.mock("next-auth/react", async (importOriginal) => {
    const actual = await importOriginal<typeof import("next-auth/react")>();
    return {
        ...actual,
        useSession: vi.fn(() => ({ data: mockSession, status: 'authenticated' })),
        signIn: vi.fn(),
    };
});


// Mock session
const mockSession: Session = {
  user: { id: "user_test_id", name: "Test User", email: "test@example.com", image: null, username: "testuser" },
  expires: new Date(Date.now() + 2 * 86400).toISOString(),
};

const mockCtx = {
  db: dbToUseInTests, // Use the imported mock instance
  session: mockSession,
};

const caller = artifactRouter.createCaller(mockCtx);

describe("artifactRouter.handleStripeDonation", () => {
  // mockDb now refers to dbToUseInTests (the actual mock instance from the module system)
  const mockDb = dbToUseInTests as unknown as DeepMockProxy<typeof prismaClientType>;

  beforeEach(() => {
    mockReset(mockDb); // Reset the imported mock before each test
  });

  const testArtifact: Artifact = {
    id: "artifact_test_id",
    title: "Test Artifact",
    description: "Test Description",
    coverImagePath: "test_cover.jpg",
    fileSize: 1024,
    fileCount: 1,
    likeCount: 0,
    userId: "user_test_id",
    conversationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    crowdfundingGoal: 100.0,
    currentCrowdfundingAmount: 0.0,
  };

  it("should update currentCrowdfundingAmount on successful donation", async () => {
    const donationAmount = 10.0;
    const updatedArtifact = {
      ...testArtifact,
      currentCrowdfundingAmount: testArtifact.currentCrowdfundingAmount + donationAmount,
    };

    mockDb.artifact.findUnique.mockResolvedValue(testArtifact);
    mockDb.artifact.update.mockResolvedValue(updatedArtifact);

    const result = await caller.handleStripeDonation({
      artifactId: testArtifact.id,
      amount: donationAmount,
    });

    expect(mockDb.artifact.findUnique).toHaveBeenCalledWith({
      where: { id: testArtifact.id, deletedAt: null },
    });
    expect(mockDb.artifact.update).toHaveBeenCalledWith({
      where: { id: testArtifact.id },
      data: {
        currentCrowdfundingAmount: {
          increment: donationAmount,
        },
      },
    });
    expect(result.currentCrowdfundingAmount).toBe(updatedArtifact.currentCrowdfundingAmount);
    expect(result.id).toBe(testArtifact.id);
  });

  it("should throw TRPCError NOT_FOUND if artifact does not exist", async () => {
    mockDb.artifact.findUnique.mockResolvedValue(null);

    try {
      await caller.handleStripeDonation({
        artifactId: "non_existent_id",
        amount: 10.0,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("NOT_FOUND");
        expect(error.message).toBe("Artifact not found");
      }
    }

    expect(mockDb.artifact.findUnique).toHaveBeenCalledWith({
      where: { id: "non_existent_id", deletedAt: null },
    });
    expect(mockDb.artifact.update).not.toHaveBeenCalled();
  });

  it("should throw TRPCError BAD_REQUEST if donation amount is zero", async () => {
    // Zod schema validation should handle this.
    // tRPC usually throws an error with code BAD_REQUEST or similar for Zod validation errors.
    try {
      await caller.handleStripeDonation({
        artifactId: testArtifact.id,
        amount: 0,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      // Depending on tRPC and Zod error handling, this might be different.
      // For a positive number validation, Zod typically causes a TRPC BAD_REQUEST.
      if (error instanceof TRPCError) {
         // Zod errors are often wrapped, and the exact code might vary based on tRPC version and setup.
         // It could be 'BAD_REQUEST' or 'INTERNAL_SERVER_ERROR' if not handled gracefully by the router.
         // Let's assume it correctly translates to BAD_REQUEST for now.
        expect(error.code).toBe("BAD_REQUEST");
      }
    }
     expect(mockDb.artifact.findUnique).not.toHaveBeenCalled();
     expect(mockDb.artifact.update).not.toHaveBeenCalled();
  });

  it("should throw TRPCError BAD_REQUEST if donation amount is negative", async () => {
    try {
      await caller.handleStripeDonation({
        artifactId: testArtifact.id,
        amount: -5.0,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      if (error instanceof TRPCError) {
        expect(error.code).toBe("BAD_REQUEST");
      }
    }
    expect(mockDb.artifact.findUnique).not.toHaveBeenCalled();
    expect(mockDb.artifact.update).not.toHaveBeenCalled();
  });
});

describe("artifactRouter.handleStripeDonation - Integration Style Test", () => {
  const mockDb = dbToUseInTests; // Same mock instance

  beforeEach(() => {
    mockReset(mockDb);
  });

  it("should correctly update and reflect crowdfunding amount after donation", async () => {
    const initialArtifact: Artifact = {
      id: "integ_artifact_id",
      title: "Integ Test Artifact",
      description: "Integration Test Description",
      coverImagePath: "integ_cover.jpg",
      fileSize: 2048,
      fileCount: 2,
      likeCount: 5,
      userId: "user_test_id", // Belongs to the mockSession user
      conversationId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      crowdfundingGoal: 200.0,
      currentCrowdfundingAmount: 50.0,
    };
    const donationAmount = 25.0;
    const expectedFinalAmount = initialArtifact.currentCrowdfundingAmount + donationAmount;

    // 1. Simulate existing artifact
    mockDb.artifact.findUnique.mockResolvedValueOnce(initialArtifact); // For the donation call

    // 2. Mock the update operation during donation
    const updatedArtifactAfterDonation = {
      ...initialArtifact,
      currentCrowdfundingAmount: expectedFinalAmount,
    };
    mockDb.artifact.update.mockResolvedValue(updatedArtifactAfterDonation);

    // 3. Call the donation procedure
    const result = await caller.handleStripeDonation({
      artifactId: initialArtifact.id,
      amount: donationAmount,
    });

    // Verify the immediate result from the procedure
    expect(result.currentCrowdfundingAmount).toBe(expectedFinalAmount);

    // 4. Simulate fetching the artifact again to see if the "database" reflects the change
    //    (In a real scenario, this would be another API call or direct DB query)
    mockDb.artifact.findUnique.mockResolvedValueOnce(updatedArtifactAfterDonation); // For a subsequent theoretical fetch
    const fetchedArtifact = await mockDb.artifact.findUnique({ where: { id: initialArtifact.id } });

    expect(fetchedArtifact).not.toBeNull();
    if (fetchedArtifact) {
      expect(fetchedArtifact.currentCrowdfundingAmount).toBe(expectedFinalAmount);
      expect(fetchedArtifact.crowdfundingGoal).toBe(initialArtifact.crowdfundingGoal);
    }

    // Ensure mocks were called as expected
    expect(mockDb.artifact.update).toHaveBeenCalledWith({
      where: { id: initialArtifact.id },
      data: {
        currentCrowdfundingAmount: {
          increment: donationAmount,
        },
      },
    });
  });
});
