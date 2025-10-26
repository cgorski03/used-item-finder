
import { initTRPC } from "@trpc/server";
import { cache } from "react";
import superjson from "superjson";
import { db } from "@db";

export const createTRPCContext = cache(async () => {
    return {
        db
    };
});

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
    transformer: superjson,
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const baseProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    // I don't have auth setup yet but I want to be able to basically mock this for now
    // This shoudl be a getUserSession call
    if (process.env.NODE_ENV !== "development") {
        throw new Error("Something is wrong")
    }

    return next({
        ctx: {
            ...ctx,
            session: "flkjjlfs",
            userId: 0,
        },
    });
});

export const publicProcedure = baseProcedure.use(async (opts) => {
    return opts.next();
});
