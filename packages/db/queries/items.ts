import type { Database } from '../node-db'
import { item, itemAiAnalysis, search } from '../schema';
import { eq, and } from 'drizzle-orm';

export function getItemInformation(db: Database, searchId: number, userId: number) {
    console.log(searchId);
    console.log(userId);
    const statement = db
        .select()
        .from(item)
        .leftJoin(itemAiAnalysis, eq(itemAiAnalysis.searchItemId, item.externalId))
        .leftJoin(search, eq(item.searchId, search.id))
        .where(
            and(
                eq(item.searchId, searchId),
                eq(search.userId, userId)
            )
        );
    console.log(statement.toSQL());
    return statement;
}
