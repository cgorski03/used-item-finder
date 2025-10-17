import { WorkerDb, search, and, eq, isNull, lte, or } from "@db";

export async function getSearchesToQueue(db: WorkerDb) {
    const now = new Date();
    try {
        return await db.select({ id: search.id }).from(search).where(
            and(
                eq(search.active, true),
                or(
                    // This is a search that has not run yet
                    isNull(search.lastRunAt),
                    lte(search.lastRunAt, now)
                )
            )
        );

    }
    catch (error: any) {
        console.error(`Error retrieving searches from database ${error}`);
        // Rethrow
        throw new Error(error);
    }
}
