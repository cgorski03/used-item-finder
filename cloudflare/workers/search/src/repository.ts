import { WorkerDb, search, item, and, eq, isNull, lte, or, sql, inArray } from "@db";
import { EbayItemSummary } from "@workers/shared";

export type NewItem = typeof item.$inferInsert;
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
        priceCurrency: ebayItem.price.currency,
        url: ebayItem.itemWebUrl,
        primaryImageUrl: ebayItem.image?.imageUrl,
        additionalImageUrls: ebayItem.additionalImages?.map(img => img.imageUrl!).filter(Boolean) as string[],
        condition: ebayItem.condition, conditionId: ebayItem.conditionId,
        buyingOptions: ebayItem.buyingOptions,
        itemCreationDate: ebayItem.itemCreationDate ? new Date(ebayItem.itemCreationDate) : undefined,
        itemEndDate: ebayItem.itemEndDate ? new Date(ebayItem.itemEndDate) : undefined,
        sellerUsername: ebayItem.seller?.username,
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
    } catch (error: any) {
        console.error(`Error saving items for ${searchId} to database`);
        throw (error);
    }
}

