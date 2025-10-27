import type { Database } from '../node-db'
import { item, itemAiAnalysis, search } from '../schema';
import { eq, and } from 'drizzle-orm';

export function setSearchActive(db: Database, searchId: number, userId: number, active: boolean) {
    return db
        .update(search)
        .set({ active })
        .where(and(eq(search.id, searchId), eq(search.userId, userId)))
        .returning({ id: search.id });
}
