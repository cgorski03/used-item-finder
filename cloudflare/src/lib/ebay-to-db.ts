import { itemInsert } from "@db";
import { EbayItemSummary } from "../ebay/api";

export const processEbayItemsForDb = (searchId: number, ebayApiItems: EbayItemSummary[]): itemInsert[] => {
    return ebayApiItems.map((ebayItem) => {
        if (!ebayItem.itemId ||
            !ebayItem.title ||
            !ebayItem.price?.value ||
            !ebayItem.price?.currency ||
            !ebayItem.itemWebUrl) {
            console.warn(`Item is missing required field ${ebayItem}`)
            return null
        }
        return {
            searchId,
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
    }).filter((it) => it !== null);
}
