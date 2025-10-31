import { itemAiAnalysisInsert, type itemSelect, type searchSelect } from '@db';
import { google } from './google';
import { GoogleGenerativeAIProvider } from '@ai-sdk/google';
import { generateText } from 'ai';
import { basicAnalysisPrompt } from './system';
import { parseJsonModelOutput, parseProviderMetadata } from './parse';

const IMAGE_ANALYSIS_SCORE_THRESHOLD = 80;
const ANALYSIS_MODEL = 'gemini-2.5-flash-lite'

const generateBasicAnalysisPrompt = (item: itemSelect, search: searchSelect) => {
    const itemDetails = `
            Item Title: ${item.title}
            Item Price: ${item.priceValue} ${item.priceCurrency}
            Item Condition: ${item.condition || "Not specified"}
            Item Seller Description: ${item.description || "None"}
            `.trim()

    const userPrompt = `Item details: ${itemDetails}
                        User's detailed description for desired item:
                        ${search.detailedRequirements}
                        Output JSON: `
    return userPrompt;
}

const getScore = async (ai: GoogleGenerativeAIProvider, item: itemSelect, search: searchSelect) => {
    const { text, providerMetadata } = await generateText({
        model: ai(ANALYSIS_MODEL),
        system: basicAnalysisPrompt,
        prompt: generateBasicAnalysisPrompt(item, search),
    });
    // Parse this into JSON 
    const result = parseJsonModelOutput(text);
    const metadata = parseProviderMetadata(providerMetadata);
    if (!result) {
        throw new Error("Error with model repsonse.");
    }
    return { ...result, tokens: metadata?.totalTokenCount };
    // Save this score to the database
}

const scoreImages = async (ai: GoogleGenerativeAIProvider, item: itemSelect, search: searchSelect) => {
    const additional = item.additionalImageUrls ?? [];
    const imageUrls = [item.primaryImageUrl, ...additional]
        .filter((url): url is string => url !== null);

    if (imageUrls.length === 0) return null;

    const { text, providerMetadata } = await generateText({
        model: ai(ANALYSIS_MODEL),
        system: basicAnalysisPrompt,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: generateBasicAnalysisPrompt(item, search),
                    },
                    ...imageUrls.map((url) => ({
                        type: 'image' as const,
                        image: url,
                    })),
                ],
            },
        ],
    });

    const result = parseJsonModelOutput(text);
    const metadata = parseProviderMetadata(providerMetadata);
    if (!result) {
        throw new Error("Error with model response.");
    }
    return { ...result, tokens: metadata?.totalTokenCount };
}

export async function analyzeItem(api_key: string, item: itemSelect, search: searchSelect): Promise<Omit<itemAiAnalysisInsert, 'searchId' | 'itemId'>> {
    // ensure the properties exist
    // do quick check on ebay item titel
    const ai = google(api_key);
    const basicAnalysisResult = await getScore(ai, item, search);
    let imageAnalysisResult;

    if (basicAnalysisResult.score > IMAGE_ANALYSIS_SCORE_THRESHOLD) {
        imageAnalysisResult = await scoreImages(ai, item, search);
    }

    return {
        score: imageAnalysisResult?.score || basicAnalysisResult.score,
        attributesScore: basicAnalysisResult.score,
        attributesReasoning: basicAnalysisResult.reasoning,
        attributesTokens: basicAnalysisResult.tokens,
        imageScore: imageAnalysisResult?.score ?? null,
        imageReasoning: imageAnalysisResult?.reasoning ?? null,
        imageAnalysisTokens: imageAnalysisResult?.tokens ?? null,
        model: ANALYSIS_MODEL,
    }
}
