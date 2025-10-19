import { EbayItemSummary } from "@workers/shared";

export const mockEbayItemMinimal: EbayItemSummary = {
    itemId: "item-123",
    title: "Blue Cotton T-Shirt Size M",
    price: {
        value: "15.99",
        currency: "USD",
    },
    itemWebUrl: "https://www.ebay.com/itm/item-123",
};

export const mockEbayItemComplete: EbayItemSummary = {
    itemId: "item-456",
    title: "Vintage Red Baseball Cap - New Era",
    price: {
        value: "29.99",
        currency: "USD",
    },
    itemWebUrl: "https://www.ebay.com/itm/item-456",
    image: {
        imageUrl: "https://i.ebayimg.com/images/g/abc/s-l500.jpg",
    },
    additionalImages: [
        { imageUrl: "https://i.ebayimg.com/images/g/def/s-l500.jpg" },
        { imageUrl: "https://i.ebayimg.com/images/g/ghi/s-l500.jpg" },
    ],
    condition: "New with tags",
    conditionId: "1000",
    buyingOptions: ["FIXED_PRICE"],
    itemCreationDate: "2024-10-15T10:30:00.000Z",
    itemEndDate: "2024-10-22T10:30:00.000Z",
    seller: {
        username: "test_seller_123",
        feedbackPercentage: "99.5",
        feedbackScore: 1500,
    },
};

export const mockEbayItemUsed: EbayItemSummary = {
    itemId: "item-789",
    title: "Nike Running Shoes Size 10 - Gently Used",
    price: {
        value: "45.00",
        currency: "USD",
    },
    itemWebUrl: "https://www.ebay.com/itm/item-789",
    image: {
        imageUrl: "https://i.ebayimg.com/images/g/jkl/s-l500.jpg",
    },
    condition: "Pre-owned",
    conditionId: "3000",
    buyingOptions: ["FIXED_PRICE", "BEST_OFFER"],
    itemCreationDate: "2024-10-10T14:20:00.000Z",
    seller: {
        username: "sneaker_seller",
        feedbackPercentage: "98.2",
        feedbackScore: 450,
    },
};

export const mockEbayItemAuction: EbayItemSummary = {
    itemId: "item-999",
    title: "Collectible Watch - Rare Model",
    price: {
        value: "125.50",
        currency: "USD",
    },
    itemWebUrl: "https://www.ebay.com/itm/item-999",
    image: {
        imageUrl: "https://i.ebayimg.com/images/g/mno/s-l500.jpg",
    },
    additionalImages: [
        { imageUrl: "https://i.ebayimg.com/images/g/pqr/s-l500.jpg" },
        { imageUrl: "https://i.ebayimg.com/images/g/stu/s-l500.jpg" },
        { imageUrl: "https://i.ebayimg.com/images/g/vwx/s-l500.jpg" },
    ],
    condition: "Used",
    conditionId: "3000",
    buyingOptions: ["AUCTION"],
    itemCreationDate: "2024-10-18T09:00:00.000Z",
    itemEndDate: "2024-10-25T09:00:00.000Z",
    seller: {
        username: "watch_collector_pro",
        feedbackPercentage: "100.0",
        feedbackScore: 2500,
    },
};

// Invalid items for negative testing
export const mockEbayItemMissingPrice: EbayItemSummary = {
    itemId: "item-invalid-1",
    title: "Missing Price Item",
    price: {
        value: "",
        currency: "USD",
    },
    itemWebUrl: "https://www.ebay.com/itm/item-invalid-1",
};

export const mockEbayItemMissingUrl: Partial<EbayItemSummary> = {
    itemId: "item-invalid-2",
    title: "Missing URL Item",
    price: {
        value: "10.00",
        currency: "USD",
    },
    // itemWebUrl is missing
};

export const mockEbayItemNoImages: EbayItemSummary = {
    itemId: "item-no-img",
    title: "Item Without Images",
    price: {
        value: "20.00",
        currency: "USD",
    },
    itemWebUrl: "https://www.ebay.com/itm/item-no-img",
    condition: "New",
    conditionId: "1000",
};

// Array of multiple items for batch testing
export const mockEbayItemBatch: EbayItemSummary[] = [
    mockEbayItemComplete,
    mockEbayItemUsed,
    mockEbayItemMinimal,
    mockEbayItemAuction,
];
