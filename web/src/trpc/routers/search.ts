import { z } from 'zod';
import { router, protectedProcedure } from '../init';
import { eq, search, and, setSearchActive, getSearchRunTrends } from '@db'

export const searchRouter = router({
    getSearchById: protectedProcedure
        .input(z.object({
            id: z.number()
        })
        ).query(async ({ ctx, input }) => {
            const userId = ctx.userId;
            const res = await (await ctx.db).select()
                .from(search)
                .where(and(eq(search.userId, userId), eq(search.id, input.id)));
            const searchObj = res[0] ?? null;
            if (!searchObj) throw new Error("Not Found");
            return searchObj;
        }),
    getUserSearches: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.userId;
            const db = await ctx.db;
            const allItems = await db.select()
                .from(search)
                .where(eq(search.userId, userId));
            // Get the search information, where exists
            const searchIds = allItems.map((s) => s.id);
            const searchStatistics = await getSearchRunTrends(db, searchIds);
            const statsMap = new Map<number, typeof searchStatistics>();
            searchStatistics.forEach(stat => {
                const key = stat.searchId;
                if (!statsMap.has(key)) {
                    statsMap.set(key, [])
                }
                statsMap.get(key)!.push(stat);
            })

            const results = allItems.map((search) => ({
                search,
                stats: statsMap.get(search.id),
            }));
            return results;
        }),
    createSearch: protectedProcedure
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
                    // TODO replace with ctx.userId after auth
                    userId: ctx.userId,
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
    setSearchActive: protectedProcedure
        .input(
            z.object({
                active: z.boolean(),
                searchId: z.number().min(0),
            })
        ).mutation(async ({ ctx, input }) => {
            const db = await ctx.db;
            const res = await setSearchActive(db, input.searchId, ctx.userId, input.active);
            return res;
        }
        )
})

