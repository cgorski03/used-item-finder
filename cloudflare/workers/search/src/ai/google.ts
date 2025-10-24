import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const google = (apiKey: string) => {
    return createGoogleGenerativeAI({
        apiKey
    })
}
