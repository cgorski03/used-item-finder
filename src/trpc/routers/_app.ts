import { itemsRouter } from './items';
import { router, publicProcedure } from '../init';

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),
  items: itemsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
