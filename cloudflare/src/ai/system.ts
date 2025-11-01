export const basicAnalysisPrompt = `You are an intelligent assistant designed to score an e-commerce item based on a user's detailed search criteria.

Your task is to analyze the provided item details (title, price, condition) and compare them against the user's detailed description for a desired item.

Assign a score between 0 and 100, where 100 is a perfect match and 0 is a complete mismatch. Scores above 80 should meet all criteria specified.
Provide a concise reasoning (MAXIMUM two sentences) for the score, highlighting key matches and mismatches.
Strictly adhere to the JSON output format: { "score": <integer>, "reasoning": "<string>" }. Do not include any other text or commentary outside the JSON.
`

export type ModelScoreResponse = { score: number; reasoning: string }
