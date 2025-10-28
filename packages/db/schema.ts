import { pgTable, boolean, integer, serial, varchar, decimal, jsonb, timestamp, unique } from 'drizzle-orm/pg-core';

export const item = pgTable('item', {
    id: serial('id').primaryKey(),
    // ebay item id
    externalId: varchar('external_id', { length: 100 }).notNull(),
    // Id of the search that found it 
    searchId: integer('search_id').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    priceValue: decimal('price_value', { precision: 10, scale: 2 }).notNull(), // Store value and currency separately
    priceCurrency: varchar('price_currency', { length: 3 }).notNull(),
    url: varchar('url', { length: 1000 }).notNull(),
    primaryImageUrl: varchar('primary_image_url', { length: 1000 }), // The main image
    additionalImageUrls: jsonb('additional_image_urls').$type<string[]>(), // Array of other images
    condition: varchar('condition', { length: 50 }),
    conditionId: varchar('condition_id', { length: 10 }),
    buyingOptions: jsonb('buying_options').$type<string[]>(), // e.g., ['FIXED_PRICE']
    itemCreationDate: timestamp('item_creation_date'),
    itemEndDate: timestamp('item_end_date'),
    sellerUsername: varchar('seller_username', { length: 100 }), // From seller.username
    rawData: jsonb('raw_data'),
    discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
    lastSeen: timestamp('last_seen').defaultNow().notNull(),
}, (table) => ({
    searchExternalUnique: unique('item_search_external_unique')
        .on(table.searchId, table.externalId),
}));

export type itemSelect = typeof item.$inferSelect;
export type itemInsert = typeof item.$inferInsert;

export const itemAiAnalysis = pgTable('item_ai_analysis', {
    id: serial('id').primaryKey(),
    searchId: integer('search_id').notNull(),
    // External ID the item analysis belongs to 
    searchItemId: varchar('search_item_id', { length: 100 }).notNull(),
    // combination, only one the user will see
    score: integer('score').notNull(),
    // score that all items will have 
    // simple basedo n basic attributes - title price text based etc
    attributesScore: integer('attributes_score').notNull(),
    attributesReasoning: varchar('attributes_reasoning', { length: 600 }).notNull(),
    imageScore: integer('image_score'),
    imageReasoning: varchar('image_reasoning', { length: 600 }),
    analyzedAt: timestamp('analyzed_at').defaultNow().notNull(),
    model: varchar('model', { length: 30 }),
}, (table) => ({
    analysisUnique: unique('item_analysis_search_unique')
        .on(table.searchId, table.searchItemId)
}));

export type itemAiAnalysisSelect = typeof itemAiAnalysis.$inferSelect;
export type itemAiAnalysisInsert = typeof itemAiAnalysis.$inferInsert;

export const search = pgTable('search', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    active: boolean('active').notNull(),
    // Comma separated list of keywords
    keywords: varchar('keywords', { length: 500 }).notNull(),
    title: varchar('title', { length: 50 }).notNull(),
    aiEnabled: boolean('ai_enabled').notNull(),
    detailedRequirements: varchar('detailed_requirements', { length: 1000 }),
    pollIntervalMinutes: integer('poll_interval_minutes').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    lastRunAt: timestamp('last_run_at'),
});

export type searchSelect = typeof search.$inferSelect;
export type searchInsert = typeof search.$inferInsert;
/*
export const userSavedItem = pgTable('userSavedItem', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    savedAt: timestamp('saved_at').defaultNow().notNull(),
    // Actual saved item composite key - needs a external id and searchId
    externalId: varchar('external_id', { length: 100 }).notNull(),
    // Id of the search that found it 
    searchId: integer('search_id').notNull(),
});
*/
