import { WorkerDb, search, and, eq, isNull, lte, or, sql } from "@db";

export async function getSearchesToQueue(db: WorkerDb) {
    try {
        return await db
            .select({ id: search.id })
            .from(search)
            .where(
                and(
                    eq(search.active, true),
                    or(
                        isNull(search.lastRunAt),
                        lte(
                            sql`${search.lastRunAt} + (${search.pollIntervalMinutes} * interval '1 minute')`,
                            sql`now()`
                        )
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
