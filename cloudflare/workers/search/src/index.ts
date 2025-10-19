import { closeWorkerDb, getWorkerDb, } from "@db";
import { setEbayToken } from "./ebay-token-utils";
import { EbayAuthTokenOptions, EbayItemSummary, parseAccessToken, searchEbay, SearchMessage } from "@workers/shared";
import { createDbItemObjectFromSummaryHelper, getSearchesToQueue, getSearchObjects, NewItem, saveItemsAndUpdateSearch } from "./repository";

export default {
    async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<Response> {
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
            const messagesToSend: { body: SearchMessage }[] = searchesToQueue.map(search => ({
                body: { search_id: search.id },
            }));
            // Queue.sendBatch allows sending multiple messages at once
            if (messagesToSend.length > 0) {
                await env.SEARCH_RUN_QUEUE.sendBatch(messagesToSend);
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
    },
    async queue(batch: MessageBatch<SearchMessage>, env: Env) {
        // without access token, no searches will succeed
        const accessToken = parseAccessToken(await env.AUTH_TOKEN_KV.get(env.EBAY_KV_KEY, { type: 'json' }));
        if (!accessToken) {
            throw new Error('No access token');
        }
        const searchIds = batch.messages.map((message) => {
            return message.body.search_id
        });
        const db = getWorkerDb(env.DATABASE_URL);
        const searches = await getSearchObjects(db, searchIds);
        if (searches.length === 0) {
            throw new Error(`No searches found for any of searchIds ${searchIds}`);
        }
        if (searches.length !== searchIds.length) {
            console.warn(`Called with ${searchIds} but only found ${searches}`);
        }
        await Promise.all(searches.map(async (search) => {
            const searchResults = await searchEbay(search.keywords, accessToken.access_token, env.EBAY_ENV);
            const items = searchResults.map((ebayItem: EbayItemSummary) => {
                const itemObj = createDbItemObjectFromSummaryHelper(ebayItem);
                if (!itemObj) {
                    console.warn(`Item is missing required field ${ebayItem}`)
                } else {
                    return { ...itemObj, searchId: search.id } as NewItem;
                }
            }).filter((it) => it != null);
            saveItemsAndUpdateSearch(db, items, search.id)
        }));
        return {
            success: true
        }
    }
}
