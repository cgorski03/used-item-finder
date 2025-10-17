import { inArray, search, WorkerDb } from "@db"

export const getSearchObjects = async (db: WorkerDb, ids: number[]) => {
    return await db.select().from(search).where(inArray(search.id, ids));
}
