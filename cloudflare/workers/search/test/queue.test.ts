import {
    env,
    createMessageBatch,
    createExecutionContext,
    getQueueResult,
    fetchMock
} from "cloudflare:test";
import { expect, it, beforeEach, afterEach, vi } from "vitest";
import { getWorkerDb, search, eq, closeWorkerDb, item } from "@db";
import { mockEbayItemBatch } from "./mock-ebay-items";
import { SearchMessage } from "@workers/shared";
import * as shared from "@workers/shared"
import worker from "../src/index";

beforeEach(async () => {
    // Connect to test database
    const db = getWorkerDb(env.DATABASE_URL);
    // Clean up from previous test
    await db.delete(search);
    await db.delete(item);
    await env.AUTH_TOKEN_KV.put(
        env.EBAY_KV_KEY,
        JSON.stringify({
            access_token: "test-token",
            expires_at: Date.now() + 3600 * 1000,
        })
    );

    vi.clearAllMocks();
    vi.spyOn(shared, "searchEbay").mockResolvedValue(mockEbayItemBatch);

    // Setup fetchMock if needed for external API calls
    fetchMock.activate();
    fetchMock.disableNetConnect();
});

afterEach(() => {
    fetchMock.assertNoPendingInterceptors();
});

it("successfully processes a batch with a single search", async () => {
    // ARRANGE - Seed database
    const db = getWorkerDb(env.DATABASE_URL);
    const [insertedSearch] = await db
        .insert(search)
        .values({
            userId: 1,
            active: true,
            keywords: "blue shirt",
            pollIntervalMinutes: 15,
            createdAt: new Date(Date.now() - 2000000),
            updatedAt: new Date(Date.now() - 2000000),
            lastRunAt: new Date(Date.now() - 1000000),
        })
        .returning({ search_id: search.id });

    await closeWorkerDb();

    // Create message batch
    const batch = createMessageBatch("SEARCH_RUN_QUEUE", [
        {
            id: "msg-1",
            timestamp: new Date(),
            body: { search_id: insertedSearch.search_id },
            attempts: 1
        },
    ]);

    // ACT - Call queue handler directly
    const ctx = createExecutionContext();
    const result = await worker.queue(batch as MessageBatch<SearchMessage>, env, ctx);
    await getQueueResult(batch, ctx);

    // ASSERT
    expect(result.success).toBe(true);

    // Verify items were saved
    const db2 = getWorkerDb(env.DATABASE_URL);
    const savedItems = await db2
        .select()
        .from(item)
        .where(eq(item.searchId, insertedSearch.search_id));

    await closeWorkerDb();

    expect(savedItems).toHaveLength(4);
    expect(savedItems[0].title).toBe("Vintage Red Baseball Cap - New Era");
    expect(savedItems[1].title).toBe("Nike Running Shoes Size 10 - Gently Used");
});

it("processes multiple searches in a batch", async () => {
    // ARRANGE
    const db = getWorkerDb(env.DATABASE_URL);
    const inserted = await db
        .insert(search)
        .values([
            {
                userId: 1,
                active: true,
                keywords: "red shoes",
                pollIntervalMinutes: 15,
                createdAt: new Date(Date.now() - 2000000),
                updatedAt: new Date(Date.now() - 2000000),
                lastRunAt: new Date(Date.now() - 1000000),
            },
            {
                userId: 2,
                active: true,
                keywords: "green pants",
                pollIntervalMinutes: 15,
                createdAt: new Date(Date.now() - 2000000),
                updatedAt: new Date(Date.now() - 2000000),
                lastRunAt: new Date(Date.now() - 1000000),
            },
        ])
        .returning({ search_id: search.id });

    await closeWorkerDb();

    // Create batch with multiple messages
    const batch = createMessageBatch("SEARCH_RUN_QUEUE", [
        {
            id: "msg-1",
            timestamp: new Date(),
            body: { search_id: inserted[0].search_id },
            attempts: 1
        },
        {
            id: "msg-2",
            timestamp: new Date(),
            body: { search_id: inserted[1].search_id },
            attempts: 1
        },
    ]);

    // ACT
    const ctx = createExecutionContext();
    const result = await worker.queue(batch as MessageBatch<SearchMessage>, env, ctx);
    await getQueueResult(batch, ctx);

    // ASSERT
    expect(result.success).toBe(true);
    // Verify items were saved for both searches
    const db2 = getWorkerDb(env.DATABASE_URL);
    const savedItems = await db2.select().from(item);
    await closeWorkerDb();

    expect(savedItems.length).toBe(4); // 2 items per search
});

it("throws error when access token is missing", async () => {
    // ARRANGE
    await env.AUTH_TOKEN_KV.delete(env.EBAY_KV_KEY);

    const db = getWorkerDb(env.DATABASE_URL);
    const [insertedSearch] = await db
        .insert(search)
        .values({
            userId: 1,
            active: true,
            keywords: "test item",
            pollIntervalMinutes: 15,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastRunAt: null,
        })
        .returning({ search_id: search.id });

    await closeWorkerDb();

    const batch = createMessageBatch("SEARCH_RUN_QUEUE", [
        {
            id: "msg-1",
            timestamp: new Date(),
            body: { search_id: insertedSearch.search_id },
            attempts: 1
        },
    ]);

    // ACT & ASSERT
    const ctx = createExecutionContext();
    await expect(worker.queue(batch as MessageBatch<SearchMessage>, env, ctx)).rejects.toThrow("No access token");
});

it("throws error when search is not found", async () => {
    // ARRANGE - Don't insert any searches
    const batch = createMessageBatch("SEARCH_RUN_QUEUE", [
        {
            id: "msg-1",
            timestamp: new Date(),
            body: { search_id: 999 }, // Non-existent search ID
            attempts: 1
        },
    ]);

    // ACT & ASSERT
    const ctx = createExecutionContext();
    await expect(worker.queue(batch as MessageBatch<SearchMessage>, env, ctx)).rejects.toThrow(
        /No searches found/
    );
});

