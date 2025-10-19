
import { SELF, env } from "cloudflare:test";
import { expect, it, beforeEach, vi } from "vitest";
import { getWorkerDb, search, closeWorkerDb, item } from "@db";
import { mockEbayItemBatch } from "./mock-ebay-items";
import { SearchMessage } from "@workers/shared";

let searchEbay = vi.fn().mockResolvedValue(mockEbayItemBatch);

function createMockMessageBatch(
    searchIds: number[]
): MessageBatch<SearchMessage> {
    return {
        queue: "search_jobs_queue",
        messages: searchIds.map((search_id, idx) => ({
            id: `msg-${idx}`,
            timestamp: new Date(),
            body: { search_id },
            attempts: 1,
            ack: vi.fn(),
            retry: vi.fn(),
        })),
        ackAll: vi.fn(),
        retryAll: vi.fn(),
    };
}

vi.mock("@workers/shared", async () => {
    const actual = await vi.importActual("@workers/shared");
    return {
        ...actual,
        searchEbay: searchEbay,
    };
});

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

    // Create a mock MessageBatch
    const batch: MessageBatch<SearchMessage> = {
        queue: "search_jobs_queue",
        messages: [
            {
                id: "msg-1",
                timestamp: new Date(),
                body: { search_id: insertedSearch.search_id },
                attempts: 1,
                ack: vi.fn(),
                retry: vi.fn(),
            },
        ],
    };

    // ACT - Call queue handler directly
    const result = await SELF.fetch().queue(batch, env);

    // ASSERT
    expect(result.success).toBe(true);

    // Verify eBay API was called
    expect(searchEbay).toHaveBeenCalledWith(
        "blue shirt",
        "test-token",
        env.EBAY_ENV
    );

    // Verify items were saved
    const db2 = getWorkerDb(env.DATABASE_URL);
    const savedItems = await db2
        .select()
        .from(item)
        .where(eq(item.searchId, insertedSearch.search_id));

    await closeWorkerDb();

    expect(savedItems).toHaveLength(2);
    expect(savedItems[0].title).toBe("Blue Cotton Shirt");
    expect(savedItems[1].title).toBe("Navy Blue Shirt");
});
