import { pgTable, uuid, varchar, decimal, jsonb, timestamp }
  from 'drizzle-orm/pg-core';

export const items = pgTable('items', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalId: varchar('external_id', { length: 100 }).notNull().unique(),
  title: varchar('title', { length: 500 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  url: varchar('url', { length: 500 }).notNull(),
  imageUrls: jsonb('image_urls').$type<string[]>().notNull(),
  discoveredAt: timestamp('discovered_at').defaultNow().notNull(),
});
