import { router, publicProcedure, createCallerFactory } from '../trpc';
import { itemsRouter } from './items';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  items: itemsRouter,
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
