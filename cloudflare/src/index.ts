import { closeWorkerDb, getWorkerDb, } from "@db";
import { type AiAnalysisMessage, type SearchMessage } from "./types/queue";
import { handleAiAnalysisRequest, handleSearchRequest } from "./queue-handlers";
import { getSearchesToQueue } from "./repository";
import { EbayAuthTokenOptions } from "ebay-oauth-nodejs-client";
import { setEbayToken } from "./ebay/tokens";

export default {
    async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
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
            return {
                success: true,
                searchesQueued: searchesToQueue.length,
            };
        }
        catch (error: any) {
            console.error('coordinator worker has failed' + error);
            throw (error);
        }
    },
    async queue(batch: MessageBatch<AiAnalysisMessage> | MessageBatch<SearchMessage>, env: Env, ctx: ExecutionContext) {
        switch (batch.queue) {
            case 'ai-analysis-queue':
                await handleAiAnalysisRequest(batch as MessageBatch<AiAnalysisMessage>, env, ctx);
                break;
            case 'search-run-queue':
                await handleSearchRequest(batch as MessageBatch<SearchMessage>, env, ctx);
                break;
        }
    }
}
