import { eq } from "drizzle-orm";
import { db } from "../shared/db/client";
import { search } from "../shared/db/schema";
import { parseAccessToken } from "../utils/set-oauth-token";

type Env = {
    DATABASE_URL: string;
    ITEM_FINDER: KVNamespace;
    EBAY_TOKEN_KEY: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const body = request.body;
        if (!body ||
            typeof body !== 'object' ||
            !('search_id' in body) ||
            typeof body.search_id !== 'number') {
            return new Response(JSON.stringify({
                success: false,
                error: 'missing search_id in body'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        const searchId = body.search_id;
        try {
            const searchRes = await db.select().from(search).where(eq(search.id, searchId)).limit(1);
            if (searchRes.length === 0) {
                throw new Error(`Search ${searchId} not found`)
            }
            const searchInfo = searchRes[0];
            const accessToken = parseAccessToken(await env.ITEM_FINDER.get(env.EBAY_TOKEN_KEY, { type: 'json' }));
            if (!accessToken) {
                throw new Error('No access token');
            }


        } catch (e: any) {

        }
        // Get the information about the search
        // Get the ebay token from the KV store
        // Make the ebay API request for the search based on the information
        // clean the data for the fields we want
        // put the information into the table
    }
}
