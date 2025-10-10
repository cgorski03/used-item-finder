import { z } from 'zod';
import { router, publicProcedure } from '../init';
import { items } from '@/server/db/schema'
import { desc } from 'drizzle-orm'

export const itemsRouter = router({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(50),
    }).optional()
    ).query(async ({ ctx, input }) => {
      const limit = input?.limit ?? 50;
      const allItems = (await ctx.db).query.items.findMany({
        orderBy: [desc(items.discoveredAt)],
        limit,
      });
      return allItems;
    }),
})
