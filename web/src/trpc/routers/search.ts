import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { desc, eq, item, search } from '@db'

export const searchRouter = router({
    getUserSearches: publicProcedure
        .input(z.object({
            userId: z.number(),
        })
        ).query(async ({ ctx, input }) => {
            const userId = input.userId;
            const allItems = (await ctx.db).select()
                .from(search)
                .where(eq(search.userId, userId));
            return allItems;
        })
})

