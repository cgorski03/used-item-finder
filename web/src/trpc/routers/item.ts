import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../init';
import { desc, getItemCountBySearch, getItemInformation, item, SORT_DIRECTION_FUNC_MAP, ITEM_COLUMNS_MAP, SortFilterByColumns, SortDirection, FILTER_OPERATOR_FUNC_MAP } from '@db'

const ItemSortBySchema = z.enum(
    Object.keys(ITEM_COLUMNS_MAP) as [SortFilterByColumns, ...SortFilterByColumns[]]
)

const SortOrderSchema = z.enum(
    Object.keys(SORT_DIRECTION_FUNC_MAP) as [SortDirection, ...SortDirection[]]
)
const FilterOperatorSchema = z.enum(
    Object.keys(FILTER_OPERATOR_FUNC_MAP) as [keyof typeof FILTER_OPERATOR_FUNC_MAP, ...Array<keyof typeof FILTER_OPERATOR_FUNC_MAP>]
);

const ColumnFilterSchema = z.discriminatedUnion('column', [
    z.object({
        column: z.literal('priceValue'),
        operator: FilterOperatorSchema,
        value: z.number(),
    }),
    z.object({
        column: z.literal('discoveredAt'),
        operator: FilterOperatorSchema,
        value: z.coerce.date(),
    }),
    z.object({
        column: z.literal('score'),
        operator: FilterOperatorSchema,
        value: z.number(),
    }),
]);
export type FilterType = z.infer<typeof ColumnFilterSchema>;

const getBySearchIdInput = z.object({
    searchId: z.number(),
    limit: z.number().min(0).max(100).default(50).optional(),
    offset: z.number().min(0).default(0).optional(),
    orderBy: z.object({
        column: ItemSortBySchema,
        direction: SortOrderSchema,
    }).optional(),
    filterBy: z.array(ColumnFilterSchema).optional(),
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
            console.log(input);
            const { searchId, limit, offset, orderBy, filterBy } = input;
            const userId = ctx.userId;
            const db = await ctx.db;

            const items = await getItemInformation(db, {
                searchId,
                userId,
                limit,
                offset,
                orderBy,
                filterBy,
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

