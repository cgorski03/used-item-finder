import { pgTable, uuid, varchar, decimal, jsonb, timestamp } from 'drizzle-orm/pg-core';

export const item = pgTable('item', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: varchar('external_id', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  priceValue: decimal('price_value', { precision: 10, scale: 2 }).notNull(), // Store value and currency separately
  priceCurrency: varchar('price_currency', { length: 3 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  primaryImageUrl: varchar('primary_image_url', { length: 500 }), // The main image
  additionalImageUrls: jsonb('additional_image_urls').$type<string[]>(), // Array of other images
  condition: varchar('condition', { length: 50 }),
  conditionId: varchar('condition_id', { length: 10 }),
  buyingOptions: jsonb('buying_options').$type<string[]>(), // e.g., ['FIXED_PRICE']
  itemCreationDate: timestamp('item_creation_date'),
  itemEndDate: timestamp('item_end_date'),
  sellerUsername: varchar('seller_username', { length: 100 }), // From seller.username
  // Store the raw JSON if you want full flexibility without parsing everything
  rawData: jsonb('raw_data'),
  discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
});
