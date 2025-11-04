import type { Database } from '../node-db'
import { item, itemAiAnalysis, search } from '../schema';
import { eq, and, asc, desc, count, gt, lt } from 'drizzle-orm';

export const ITEM_COLUMNS_MAP = {
    priceValue: item.priceValue,
    discoveredAt: item.discoveredAt,
    score: itemAiAnalysis.score,
}
type ITEM_COLUMNS_VALUE_MAP = {
    priceValue: number;
    discoveredAt: Date;
    score: number;
}

export type SortFilterByColumns = keyof typeof ITEM_COLUMNS_MAP;

export const FILTER_OPERATOR_FUNC_MAP = {
    'gt': gt,
    'lt': lt,
} as const

export type ColumnFilter<T extends SortFilterByColumns = SortFilterByColumns> = {
    column: T;
    operator: keyof typeof FILTER_OPERATOR_FUNC_MAP;
    value: ITEM_COLUMNS_VALUE_MAP[T];
}

export const SORT_DIRECTION_FUNC_MAP = {
    'asc': asc,
    'desc': desc,
}
export type SortDirection = keyof typeof SORT_DIRECTION_FUNC_MAP;

type getItemsBySearchIdInput = {
    searchId: number;
    userId: number;
    limit: number;
    offset: number;
    orderBy?: {
        column: SortFilterByColumns;
        direction: SortDirection;
    }
    filterBy?: ColumnFilter[];
}

export async function getItemInformation(db: Database, input: getItemsBySearchIdInput) {
    console.log(input);
    const { searchId, userId, limit, offset, orderBy, filterBy } = input;
    const filterConditions = filterBy?.map((filter) =>
        FILTER_OPERATOR_FUNC_MAP[filter.operator](
            ITEM_COLUMNS_MAP[filter.column],
            filter.value)
    ) ?? []
    const query = db
        .select({ item: item, itemAiAnalysis })
        .from(item)
        .leftJoin(
            itemAiAnalysis,
            and(
                eq(itemAiAnalysis.itemId, item.id),
                eq(itemAiAnalysis.searchId, searchId)
            )
        )
        .innerJoin(search, eq(item.searchId, search.id))
        .where(
            and(
                eq(item.searchId, searchId),
                eq(search.userId, userId),
                ...filterConditions
            )
        );

    if (orderBy) {
        query.orderBy(SORT_DIRECTION_FUNC_MAP[orderBy.direction](ITEM_COLUMNS_MAP[orderBy.column]));
    }
    query.limit(limit).offset(offset);
    console.log(query.toSQL());
    return await query;
}

export async function getItemCountBySearch(
    db: Database,
    searchId: number,
    userId: number
) {
    const countObj = await db
        .select({ count: count() })
        .from(item)
        .innerJoin(search, eq(item.searchId, search.id))
        .where(
            and(eq(item.searchId, searchId), eq(search.userId, userId))
        );

    return countObj[0];
}

