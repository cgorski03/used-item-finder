import { WorkerDb, search, item, and, eq, isNull, lte, or, sql, inArray, itemAiAnalysisInsert, itemAiAnalysis, searchRun, searchRunSelect, itemInsert } from "@db";
import { EbayItemSummary } from "./ebay/api";

export async function getSearchesToQueue(db: WorkerDb) {
    try {
        const query = db
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
        return await query;
    }
    catch (error: any) {
        console.error(`Error retrieving searches from database ${error}`);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack,
        });
        // Rethrow
        throw new Error(error);
    }
}


export const getSearchObjects = async (db: WorkerDb, ids: number[]) => {
    return await db.select().from(search).where(inArray(search.id, ids));
}

export const saveItemsAndUpdateSearch = async (
    db: WorkerDb,
    items: itemInsert[],
    searchId: number
): Promise<itemInsert[]> => {
    const uniqueItems = Array.from(
        new Map(
            items.map((item) => [`${item.searchId}-${item.externalId}`, item])
        ).values()
    );
    try {
        console.log(`saving ${items.length} items`);

        const newItems = await db.transaction(async (tx) => {
            const insertTime = new Date();

            // Explicitly set discoveredAt for all items
            const itemsWithTimestamp = uniqueItems.map((i) => ({
                ...i,
                discoveredAt: insertTime,
            }));

            const insertedRows = await tx
                .insert(item)
                .values(itemsWithTimestamp)
                .onConflictDoUpdate({
                    target: [item.searchId, item.externalId],
                    set: {
                        lastSeen: new Date(),
                        // DON'T update discoveredAt on conflict
                    },
                })
                .returning();

            // New items have discoveredAt === insertTime
            const newItemsFromInsert = insertedRows.filter(
                (row) => row.discoveredAt.getTime() === insertTime.getTime()
            );

            await tx
                .update(search)
                .set({ lastRunAt: new Date() })
                .where(eq(search.id, searchId));

            return newItemsFromInsert;
        });

        return newItems;
    } catch (error: any) {
        console.error(`Error saving items for ${searchId} to database`);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack,
        });
        throw error;
    }
};

export const getItemSearchObjects = async (db: WorkerDb, itemIds: number[]) => {
    try {
        const query = db.select().from(item)
            .leftJoin(search, eq(item.searchId, search.id))
            .where(inArray(item.id, itemIds))
            .prepare('no_cache');

        return await query.execute();
    } catch (error: any) {
        console.error('Error getting item search objects. Details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        throw error;
    }
}

export const saveItemBasicScore = async (db: WorkerDb, newItemAnalysis: itemAiAnalysisInsert) => {
    try {
        await db.insert(itemAiAnalysis)
            .values(newItemAnalysis)
            .onConflictDoUpdate({
                target: [itemAiAnalysis.searchId, itemAiAnalysis.itemId],
                set: {
                    score: newItemAnalysis.score,
                    attributesScore: newItemAnalysis.attributesScore,
                    attributesReasoning: newItemAnalysis.attributesReasoning,
                    imageScore: newItemAnalysis.imageScore,
                    imageReasoning: newItemAnalysis.imageReasoning,
                    analyzedAt: new Date(),
                    model: newItemAnalysis.model,
                }
            });
    }
    catch (error: any) {
        console.error(`Error analysis for search ${newItemAnalysis.searchId} ${newItemAnalysis.itemId} to database`);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        throw error;
    }
}

export const saveSearchRunStub = async (db: WorkerDb, searchId: number) => {
    const [searchRunInstance] = await db.insert(searchRun).values({
        searchId,
        startedAt: new Date(),
    }).returning();
    console.log(searchRunInstance);
    return searchRunInstance;
}

type searchRunFailureRequest = {
    searchRun: searchRunSelect,
    errorMessage: string;
    errorDetails: Error;
}
export const saveSearchRunFailure = async (db: WorkerDb, request: searchRunFailureRequest) => {
    const [searchRunInstance] = await db.update(searchRun).set({
        completedAt: new Date(),
        status: 'failed',
        errorMessage: request.errorMessage,
        errorDetails: String(request.errorDetails),
    })
        .where(eq(searchRun.id, request.searchRun.id))
        .returning();
    return searchRunInstance
}

type searchRunSuccessRequest = {
    searchRun: searchRunSelect,
    totalApiItems: number;
    newItemsInserted: number;
}
export const saveSearchRunSuccess = async (db: WorkerDb, request: searchRunSuccessRequest) => {
    const [searchRunInstance] = await db.update(searchRun).set({
        itemsFoundInApi: request.totalApiItems,
        newItemsInserted: request.newItemsInserted,
        completedAt: new Date(),
        status: 'success'
    })
        .where(eq(searchRun.id, request.searchRun.id))

    return searchRunInstance
}

