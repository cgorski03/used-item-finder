import { SELF, env } from "cloudflare:test";
import { expect, it, beforeEach } from "vitest";
import { getWorkerDb, search, eq } from "@db";

beforeEach(async () => {
    // Connect to test database
    const db = getWorkerDb(env.DATABASE_URL);
    // Clean up from previous test
    await db.delete(search);
});

it("queues searches when found", async () => {
    // ARRANGE - Seed with drizzle
    console.log(env);
    console.log("starting");
    const db = getWorkerDb(env.DATABASE_URL);
    console.log()
    await db.insert(search).values({
        userId: 0,
        active: true,
        keywords: "fkldsA",
        pollIntervalMinutes: 15,
        createdAt: new Date(Date.now() - 2000000),
        updatedAt: new Date(Date.now() - 2000000),
        lastRunAt: new Date(Date.now() - 1000000),
    });

    // ACT - Call worker via SELF
    const response = await SELF.fetch("https://example.com/");

    // ASSERT - Verify with drizzle
    expect(response.status).toBe(200);
    const result = await response.json() as any;
    expect(result.searchesQueued).toBe(1);
});
