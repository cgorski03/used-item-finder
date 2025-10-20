
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

export const publicProcedure = baseProcedure.use(async (opts) => {
    console.log("-> Public procedure called:", opts.path);
    return opts.next();
});
