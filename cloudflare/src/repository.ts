import { WorkerDb, search, item, and, eq, isNull, lte, or, sql, inArray, itemAiAnalysisInsert, itemAiAnalysis, itemInsert } from "@db";
import { EbayItemSummary } from "./ebay/api";

export type NewItem = typeof item.$inferInsert;

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

        console.log(`${query.toSQL()}`);
        const results = await query;
        console.log(`getSearchesToQueue found ${results.length} searches`);

        // Debug: check what's actually in the database
        const all = await db.select().from(search);
        console.log(`Total searches in DB: ${all.length}`, all);

        return results;
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

export const createDbItemObjectFromSummaryHelper = (ebayItem: EbayItemSummary) => {
    if (!ebayItem.itemId ||
        !ebayItem.title ||
        !ebayItem.price?.value ||
        !ebayItem.price?.currency ||
        !ebayItem.itemWebUrl) {
        return null
    }
    return {
        externalId: ebayItem.itemId,
        title: ebayItem.title,
        priceValue: ebayItem.price.value,
        priceCurrency: ebayItem.price.currency || "USD",
        url: ebayItem.itemWebUrl,
        primaryImageUrl: ebayItem.image?.imageUrl ?? null,
        additionalImageUrls: ebayItem.additionalImages
            ?.map(img => img?.imageUrl)
            .filter((url): url is string => url !== undefined)
            ?? null,
        condition: ebayItem.condition ?? null,
        conditionId: ebayItem.conditionId ?? null,
        buyingOptions: ebayItem.buyingOptions ?? null,
        itemCreationDate: ebayItem.itemCreationDate ? new Date(ebayItem.itemCreationDate) : null,
        itemEndDate: ebayItem.itemEndDate ? new Date(ebayItem.itemEndDate) : null,
        sellerUsername: ebayItem.seller?.username ?? null,
        rawData: ebayItem,
        description: ebayItem.shortDescription,
    };
}

export const getSearchObjects = async (db: WorkerDb, ids: number[]) => {
    return await db.select().from(search).where(inArray(search.id, ids));
}

export const saveItemsAndUpdateSearch = async (
    db: WorkerDb,
    items: NewItem[],
    searchId: number
): Promise<NewItem[]> => {
    try {
        console.log(`saving ${items.length} items`);

        const newItems = await db.transaction(async (tx) => {
            const insertTime = new Date();

            // Explicitly set discoveredAt for all items
            const itemsWithTimestamp = items.map((i) => ({
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
                target: [itemAiAnalysis.searchId, itemAiAnalysis.searchItemId],
                set: {
                    score: newItemAnalysis.score,
                    attributesScore: newItemAnalysis.attributesScore,
                    attributesReasoning: newItemAnalysis.attributesReasoning,
                    imageScore: newItemAnalysis.imageScore,
                    imageReasoning: newItemAnalysis.imageReasoning,
                    analyzedAt: new Date(),
                }
            });
    }
    catch (error: any) {
        console.error(`Error analysis for search ${newItemAnalysis.searchId} ${newItemAnalysis.searchItemId} to database`);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        throw error;
    }

}
