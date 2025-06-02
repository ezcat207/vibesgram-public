import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { artifactRouter } from "./routers/artifact/router";
import { projectIdeaRouter } from "./routers/projectIdea"; // Assuming the file is directly in routers
import { stripeRouter } from "./routers/stripe";
import { developerApplicationRouter } from "./routers/developerApplication";
import { projectMilestoneRouter } from "./routers/projectMilestone";
import { pledgeRouter } from "./routers/pledge";
import { conversationRouter } from "./routers/conversation/router";
import { userRouter } from "./routers/user/router";
import { utilsRouter } from "./routers/utils/router";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  conversation: conversationRouter,
  artifact: artifactRouter,
  utils: utilsRouter,
  projectIdea: projectIdeaRouter,
  stripe: stripeRouter,
  developerApplication: developerApplicationRouter,
  projectMilestone: projectMilestoneRouter,
  pledge: pledgeRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
