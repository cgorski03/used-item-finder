import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { desc, eq, search } from '@db'

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
        }),
    createSearch: publicProcedure
        .input(
            z.object({
                keywords: z.string().max(500),
                title: z.string().max(50),
                aiEnabled: z.boolean().default(false),
                detailedRequirements: z.string().max(1000).optional(),
                pollInterval: z.number().int().min(15).default(15),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const [insertedSearch] = await (await ctx.db)
                .insert(search)
                .values({
                    // replace with ctx.userId after auth
                    userId: 0,
                    keywords: input.keywords,
                    title: input.title,
                    aiEnabled: input.aiEnabled,
                    detailedRequirements: input.detailedRequirements ?? null,
                    pollIntervalMinutes: input.pollInterval,
                    active: true,
                })
                .returning();

            return insertedSearch;
        }),
})

