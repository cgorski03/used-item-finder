import type { Database } from '../node-db'
import { search, searchRun } from '../schema';
import { eq, and, sql, inArray } from 'drizzle-orm';

export function setSearchActive(db: Database, searchId: number, userId: number, active: boolean) {
    return db
        .update(search)
        .set({ active })
        .where(and(eq(search.id, searchId), eq(search.userId, userId)))
        .returning({ id: search.id });
}

export function getSearchRunTrends(db: Database, searchIds: number[]) {
    return db.select({
        searchId: searchRun.searchId,
        date: sql<string>`DATE(${searchRun.startedAt})`,
        avgItemsFound: sql<number>`AVG(${searchRun.itemsFoundInApi})`,
        maxItemsFound: sql<number>`MAX(${searchRun.itemsFoundInApi})`,
        runCount: sql<number>`COUNT(*)`,
        newItemsInserted: sql<number>`COALESCE(SUM(${searchRun.newItemsInserted}), 0)`,
    })
        .from(searchRun)
        .where(inArray(searchRun.searchId, searchIds))
        .groupBy(searchRun.searchId, sql`DATE(${searchRun.startedAt})`)
        .orderBy(sql`DATE(${searchRun.startedAt}) ASC`);
}
