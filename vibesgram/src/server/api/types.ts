import { inferRouterInputs } from "@trpc/server";

import { inferRouterOutputs } from "@trpc/server";

import { type AppRouter } from "./root";

export type RouterOutput = inferRouterOutputs<AppRouter>;
export type RouterInput = inferRouterInputs<AppRouter>;
