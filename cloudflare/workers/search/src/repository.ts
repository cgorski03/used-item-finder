import { WorkerDb, search, item, and, eq, isNull, lte, or, sql, inArray } from "@db";
import { EbayItemSummary } from "@workers/shared";

export type NewItem = typeof item.$inferInsert;
export async function getSearchesToQueue(db: WorkerDb) {
    try {
        const results = await db
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

        console.log(`getSearchesToQueue found ${results.length} searches`);

        // Debug: check what's actually in the database
        const all = await db.select().from(search);
        console.log(`Total searches in DB: ${all.length}`, all);

        return results;
    }
    catch (error: any) {
        console.error(`Error retrieving searches from database ${error}`);
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
    const toDate = (value: string | Date | undefined | null): Date | null => {
        if (!value) return null;
        if (value instanceof Date) return value;
        if (typeof value === 'string') return new Date(value);
        return null;
    };
    return {
        externalId: ebayItem.itemId,
        title: ebayItem.title,
        priceValue: ebayItem.price.value,
        priceCurrency: ebayItem.price.currency || "USD",
        url: ebayItem.itemWebUrl,
        primaryImageUrl: ebayItem.image?.imageUrl ?? null,
        additionalImageUrls: ebayItem.additionalImages?.map(img => img.imageUrl) ?? null,
        condition: ebayItem.condition ?? null,
        conditionId: ebayItem.conditionId ?? null,
        buyingOptions: ebayItem.buyingOptions ?? null,
        itemCreationDate: ebayItem.itemCreationDate ? new Date(ebayItem.itemCreationDate) : null,
        itemEndDate: ebayItem.itemEndDate ? new Date(ebayItem.itemEndDate) : null,
        sellerUsername: ebayItem.seller?.username ?? null,
        rawData: ebayItem,
    };
}
export const getSearchObjects = async (db: WorkerDb, ids: number[]) => {
    return await db.select().from(search).where(inArray(search.id, ids));
}

export const saveItemsAndUpdateSearch = async (db: WorkerDb, items: NewItem[], searchId: number) => {
    try {
        await db.transaction(
            async (tx) => {
                await tx.insert(item).values(items)
                    .onConflictDoUpdate({
                        target: [item.searchId, item.externalId],
                        set: { lastSeen: new Date() }
                    });
                await tx.update(search).set({
                    lastRunAt: new Date(),
                })
                    .where(eq(search.id, searchId));
            }
        )
    }
    catch (error: any) {
        console.error(`Error saving items for ${searchId} to database`);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            detail: error.detail,
            stack: error.stack
        });
        throw error;
    }
}

