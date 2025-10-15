import { itemRouter } from './item';
import { router, publicProcedure } from '../init';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  item: itemRouter,
});

export type AppRouter = typeof appRouter;
