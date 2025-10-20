import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { desc, item } from '@db'

export const itemRouter = router({
    getAll: publicProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(50),
        }).optional()
        ).query(async ({ ctx, input }) => {
            const limit = input?.limit ?? 50;
            const allItems = (await ctx.db).query.item.findMany({
                orderBy: [desc(item.discoveredAt)],
                limit,
            });
            return allItems;
        }),
    getById: publicProcedure
        .input(z.object({
            id: z.string()
        }).required()
        ).query(async ({ ctx, input }) => {
            const externalId = input?.id;
            const item = (await ctx.db).query.item.findFirst({
                with: {
                    externalId
                }
            });
            return item;
        }),
})

