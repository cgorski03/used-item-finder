import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../init';
import { desc, eq, getItemCountBySearch, getItemInformation, item, SORT_DIRECTION_FUNC_MAP, SORTABLE_ITEM_COLUMNS_MAP, SortByColumns, SortDirection } from '@db'

const ItemSortBySchema = z.enum(
    Object.keys(SORTABLE_ITEM_COLUMNS_MAP) as [SortByColumns, ...SortByColumns[]]
)

const SortOrderSchema = z.enum(
    Object.keys(SORT_DIRECTION_FUNC_MAP) as [SortDirection, ...SortDirection[]]
)

const getBySearchIdInput = z.object({
    searchId: z.number(),
    limit: z.number().min(0).max(100).default(50).optional(),
    offset: z.number().min(0).default(0).optional(),
    orderBy: z.object({
        column: ItemSortBySchema,
        direction: SortOrderSchema,
    }).optional()
}).required()

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
    getBySearchId: protectedProcedure
        .input(getBySearchIdInput).query(async ({ ctx, input }) => {
            const { searchId, limit, offset, orderBy } = input;
            const userId = ctx.userId;
            const db = await ctx.db;

            const items = await getItemInformation(db, {
                searchId,
                userId,
                limit,
                offset,
                orderBy
            });

            console.log(`ITEMS RETURNED`);
            const count = await getItemCountBySearch(db, searchId, userId);
            console.log(`ITEM COUNT RETURN ${count}`);
            return { items, count: count }
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

