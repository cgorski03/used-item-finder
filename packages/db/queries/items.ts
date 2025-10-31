import type { Database } from '../node-db'
import { item, itemAiAnalysis, search } from '../schema';
import { eq, and } from 'drizzle-orm';

export function getItemInformation(db: Database, searchId: number, userId: number) {
    return db
        .select()
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
}
