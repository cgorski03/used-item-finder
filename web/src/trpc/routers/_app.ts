import { itemRouter } from './item';
import { router, publicProcedure } from '../init';
import { searchRouter } from './search';

export const appRouter = router({
    healthcheck: publicProcedure.query(() => 'yay!'),
    item: itemRouter,
    search: searchRouter,
});

export type AppRouter = typeof appRouter;
