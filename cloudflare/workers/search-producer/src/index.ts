import { and, eq, isNull, lte, or } from "drizzle-orm";
import { db, search } from "@db";
import { setEbayToken } from "@workers/shared";

type Env = {
    DATABASE_URL: string;
    EBAY_TOKEN_KEY: string;
    search_jobs_queue: Queue;
    ITEM_FINDER: KVNamespace;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const now = new Date();
        console.log('Request triggered');
        try {
            // All searches that should be published to the queue
            const searches = await db.select().from(search).where(
                and(
                    eq(search.active, true),
                    or(
                        // This is a search that has not run yet
                        isNull(search.lastRunAt),
                        lte(search.lastRunAt, now)
                    )
                )
            );
            console.log(`Found ${searches.length}`)
            const messagesToSend = searches.map(search => ({
                body: { search_id: search.id },
            }));
            if (messagesToSend.length > 0) {
                // Make sure there is a token 
                await setEbayToken(env.ITEM_FINDER, env.EBAY_TOKEN_KEY);
                // Queue.sendBatch allows sending multiple messages at once
                await env.search_jobs_queue.sendBatch(messagesToSend);
                console.log(`Queued ${messagesToSend.length} search jobs to Cloudflare Queue.`);
            }
            return new Response(JSON.stringify({
                success: true,
                searchesQueued: searches.length,
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        catch (error: any) {
            console.error('coordinator worker has failed');
            return new Response(JSON.stringify({ error: 'Failed to coordinate searches', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
}
