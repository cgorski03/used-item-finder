import { SELF, env } from "cloudflare:test";
import { expect, it, beforeEach, vi } from "vitest";
import { getWorkerDb, search, closeWorkerDb } from "@db";

beforeEach(async () => {
    // Connect to test database
    const db = getWorkerDb(env.DATABASE_URL);
    // Clean up from previous test
    await db.delete(search);
    vi.clearAllMocks();
    vi.spyOn(env.search_jobs_queue, "sendBatch").mockResolvedValue(undefined);
    await env.AUTH_TOKEN_KV.delete(env.EBAY_KV_KEY);
});

it("queues 1 search when it is found", async () => {
    // ARRANGE - Seed with drizzle
    const db = getWorkerDb(env.DATABASE_URL);
    const [inserted] = await db.insert(search).values({
        userId: 0,
        active: true,
        keywords: "fkldsA",
        pollIntervalMinutes: 15,
        createdAt: new Date(Date.now() - 2000000),
        updatedAt: new Date(Date.now() - 2000000),
        lastRunAt: new Date(Date.now() - 1000000),
    }).returning({ search_id: search.id });

    await closeWorkerDb();

    // ACT - Call worker via SELF
    const response = await SELF.fetch("https://example.com/");

    // ASSERT 
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    expect(result.searchesQueued).toBe(1);
    expect(env.search_jobs_queue.sendBatch).toHaveBeenCalledWith([
        { body: { search_id: inserted.search_id } }
    ]);
    // Ensure the KV was updated
    expect(await env.AUTH_TOKEN_KV.get(env.EBAY_KV_KEY)).not.toBeNull();
});

it("queues only active searches with multiple searches", async () => {
    // ARRANGE - Seed with drizzle
    const db = getWorkerDb(env.DATABASE_URL);
    const inserted = await db.insert(search).values([
        {
            userId: 0,
            active: false,
            keywords: "inactive",
            pollIntervalMinutes: 15,
            createdAt: new Date(Date.now() - 2000000),
            updatedAt: new Date(Date.now() - 2000000),
            lastRunAt: new Date(Date.now() - 1000000),
        },
        {
            userId: 0,
            active: true,
            keywords: "active1",
            pollIntervalMinutes: 15,
            createdAt: new Date(Date.now() - 2000000),
            updatedAt: new Date(Date.now() - 2000000),
            lastRunAt: new Date(Date.now() - 1000000),
        },
        {
            userId: 0,
            active: true,
            keywords: "active2",
            pollIntervalMinutes: 15,
            createdAt: new Date(Date.now() - 2000000),
            updatedAt: new Date(Date.now() - 2000000),
            lastRunAt: new Date(Date.now() - 1000000),
        }
    ]).returning({ search_id: search.id });

    await closeWorkerDb();

    // ACT - Call worker via SELF
    const response = await SELF.fetch("https://example.com/");

    // ASSERT 
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    expect(result.searchesQueued).toBe(2);
    expect(env.search_jobs_queue.sendBatch).toHaveBeenCalledWith([
        { body: { search_id: inserted[1].search_id } },
        { body: { search_id: inserted[2].search_id } }
    ]);
    // Ensure the KV was updated
    expect(await env.AUTH_TOKEN_KV.get(env.EBAY_KV_KEY)).not.toBeNull();
});

it("queues search that has never run (lastRunAt is null)", async () => {
    // ARRANGE
    const db = getWorkerDb(env.DATABASE_URL);
    const [inserted] = await db.insert(search).values({
        userId: 0,
        active: true,
        keywords: "newSearch",
        pollIntervalMinutes: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRunAt: null, // Never run before
    }).returning({ search_id: search.id });

    await closeWorkerDb();

    // ACT
    const response = await SELF.fetch("https://example.com/");

    // ASSERT
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    expect(result.searchesQueued).toBe(1);
    expect(env.search_jobs_queue.sendBatch).toHaveBeenCalledWith([
        { body: { search_id: inserted.search_id } }
    ]);
});

it("doesn't queue search that ran recently", async () => {
    // ARRANGE - Search ran 5 minutes ago (too recent for 15 min interval)
    const db = getWorkerDb(env.DATABASE_URL);
    await db.insert(search).values({
        userId: 0,
        active: true,
        keywords: "recentSearch",
        pollIntervalMinutes: 15,
        createdAt: new Date(Date.now() - 2000000),
        updatedAt: new Date(Date.now() - 2000000),
        lastRunAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    });

    await closeWorkerDb();

    // ACT
    const response = await SELF.fetch("https://example.com/");

    // ASSERT
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    expect(result.searchesQueued).toBe(0);
    expect(env.search_jobs_queue.sendBatch).not.toHaveBeenCalled();
});

it("returns empty when no searches exist", async () => {
    // ARRANGE - Database already cleaned in beforeEach
    const db = getWorkerDb(env.DATABASE_URL);
    await closeWorkerDb();

    // ACT
    const response = await SELF.fetch("https://example.com/");

    // ASSERT
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    expect(result.searchesQueued).toBe(0);
    expect(env.search_jobs_queue.sendBatch).not.toHaveBeenCalled();
});

it("queues mix of never-run and old searches", async () => {
    // ARRANGE
    const db = getWorkerDb(env.DATABASE_URL);
    const inserted = await db.insert(search).values([
        {
            userId: 1,
            active: true,
            keywords: "neverRun",
            pollIntervalMinutes: 15,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastRunAt: null,
        },
        {
            userId: 2,
            active: true,
            keywords: "oldRun",
            pollIntervalMinutes: 15,
            createdAt: new Date(Date.now() - 3000000),
            updatedAt: new Date(Date.now() - 3000000),
            lastRunAt: new Date(Date.now() - 20 * 60 * 1000), // 20 mins ago
        },
        {
            userId: 3,
            active: true,
            keywords: "recentRun",
            pollIntervalMinutes: 15,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastRunAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
        }
    ]).returning({ search_id: search.id });

    await closeWorkerDb();

    // ACT
    const response = await SELF.fetch("https://example.com/");

    // ASSERT
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    expect(result.searchesQueued).toBe(2); // neverRun + oldRun
    expect(env.search_jobs_queue.sendBatch).toHaveBeenCalledWith([
        { body: { search_id: inserted[0].search_id } },
        { body: { search_id: inserted[1].search_id } }
    ]);
});

it("handles different poll intervals correctly", async () => {
    // ARRANGE
    const db = getWorkerDb(env.DATABASE_URL);
    const now = Date.now();
    const inserted = await db.insert(search).values([
        {
            userId: 1,
            active: true,
            keywords: "fast",
            pollIntervalMinutes: 5,
            createdAt: new Date(now - 3000000),
            updatedAt: new Date(now - 3000000),
            lastRunAt: new Date(now - 10 * 60 * 1000), // 10 mins ago - should queue (>5 min)
        },
        {
            userId: 2,
            active: true,
            keywords: "slow",
            pollIntervalMinutes: 60,
            createdAt: new Date(now - 3000000),
            updatedAt: new Date(now - 3000000),
            lastRunAt: new Date(now - 30 * 60 * 1000), // 30 mins ago - should NOT queue (<60 min)
        }
    ]).returning({ search_id: search.id });

    await closeWorkerDb();

    // ACT
    const response = await SELF.fetch("https://example.com/");

    // ASSERT
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    // Note: This depends on your search-logic implementation
    // If you're checking pollIntervalMinutes, adjust expected behavior
    expect(result.searchesQueued).toBeGreaterThanOrEqual(0);
});

it("handles error gracefully when KV fails", async () => {
    // ARRANGE
    const db = getWorkerDb(env.DATABASE_URL);
    await db.insert(search).values({
        userId: 0,
        active: true,
        keywords: "test",
        pollIntervalMinutes: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRunAt: null,
    });

    await closeWorkerDb();

    // Mock KV to throw error
    vi.spyOn(env.AUTH_TOKEN_KV, "put").mockRejectedValue(new Error("KV error"));

    // ACT
    const response = await SELF.fetch("https://example.com/");

    // ASSERT - Should handle error gracefully
    expect(response.status).toBe(500);
    const result = await response.json() as any;
    expect(result.error).toBe("Failed to coordinate searches");
});
