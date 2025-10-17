import { getWorkerDb, search, and, eq, isNull, lte, or } from "@db";
import { setEbayToken } from "./ebay-token-utils";
import { EbayAuthTokenOptions } from "@workers/shared";
export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const db = await getWorkerDb(env.DATABASE_URL);
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
                const ebayOptions: EbayAuthTokenOptions = {
                    clientId: env.EBAY_CLIENT_ID,
                    clientSecret: env.EBAY_CLIENT_SECRET,
                    devid: env.EBAY_DEV_ID,
                    env: env.EBAY_ENV
                };
                await setEbayToken(env.ITEM_FINDER, env.EBAY_KV_KEY, ebayOptions);
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
