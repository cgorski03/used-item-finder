import { closeWorkerDb, getWorkerDb, } from "@db";
import { setEbayToken } from "./ebay-token-utils";
import { EbayAuthTokenOptions } from "@workers/shared";
import { getSearchesToQueue } from "./search-logic";

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const db = getWorkerDb(env.DATABASE_URL);
        try {
            const ebayOptions: EbayAuthTokenOptions = {
                clientId: env.EBAY_CLIENT_ID,
                clientSecret: env.EBAY_CLIENT_SECRET,
                devid: env.EBAY_DEV_ID,
                env: env.EBAY_ENV
            };
            await setEbayToken(env.AUTH_TOKEN_KV, env.EBAY_KV_KEY, ebayOptions);
            const searchesToQueue = await getSearchesToQueue(db);
            await closeWorkerDb();
            console.log(`Found ${searchesToQueue.length} to add to queue`)
            const messagesToSend = searchesToQueue.map(search => ({
                body: { search_id: search.id },
            }));
            // Queue.sendBatch allows sending multiple messages at once
            if (messagesToSend.length > 0) {
                await env.search_jobs_queue.sendBatch(messagesToSend);
                console.log(`Queued ${messagesToSend.length} search jobs to Cloudflare Queue.`);
            }
            return new Response(JSON.stringify({
                success: true,
                searchesQueued: searchesToQueue.length,
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        catch (error: any) {
            console.error('coordinator worker has failed' + error);
            return new Response(JSON.stringify({ error: 'Failed to coordinate searches', details: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
    }
}
