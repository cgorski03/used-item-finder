import { off } from 'node:process';
import type { Database } from '../node-db'
import { item, itemAiAnalysis, search } from '../schema';
import { eq, and, asc, desc, count } from 'drizzle-orm';

export const SORTABLE_ITEM_COLUMNS_MAP = {
    priceValue: item.priceValue,
    itemCreationDate: item.itemCreationDate,
    score: itemAiAnalysis.score,
}
export type SortByColumns = keyof typeof SORTABLE_ITEM_COLUMNS_MAP;

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
        column: SortByColumns;
        direction: SortDirection;
    }
}

export async function getItemInformation(db: Database, input: getItemsBySearchIdInput) {
    const { searchId, userId, limit, offset, orderBy } = input;
    console.log(input);
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
                eq(search.userId, userId)
            )
        );
    if (orderBy) {
        query.orderBy(SORT_DIRECTION_FUNC_MAP[orderBy.direction](SORTABLE_ITEM_COLUMNS_MAP[orderBy.column]));
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
