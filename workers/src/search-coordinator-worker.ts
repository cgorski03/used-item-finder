import { and, eq, isNull, lte, or } from "drizzle-orm";
import { db } from "../shared/db/client";
import { search } from '../shared/db/schema';

type Env = {
    DATABASE_URL: string;
    search_jobs_queue: Queue;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        const now = new Date();
        console.log('Request triggered');
        // All searches that should be published to the queue
        const searches = db.select().from(search).where(
            and(
                eq(search.active, true),
                or(
                    // This is a search that has not run yet
                    isNull(search.nextRun),
                    lte(search.nextRun, now)
                )
            )
        )

    }
}
