import { type itemSelect, type searchSelect } from '@db';
import { google } from './google';
import { GoogleGenerativeAIProvider } from '@ai-sdk/google';
import { generateText } from 'ai';
import { basicAnalysisPrompt } from './system';
import { parseJsonModelOutput } from './parse';

const IMAGE_ANALYSIS_SCORE_THRESHOLD = 70;
const ANALYSIS_MODEL = 'gemini-2.5-flash-lite'

const generateBasicAnalysisPrompt = (item: itemSelect, search: searchSelect) => {
    const itemDetails = `
            Item Title: ${item.title}
            Item Price: ${item.priceValue} ${item.priceCurrency}
            Item Condition: ${item.condition || "Not specified"}
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
    console.log(`${providerMetadata}`)
    const result = parseJsonModelOutput(text);
    if (!result) {
        throw new Error("Error with model repsonse.");
    }
    return result;
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

    console.log(`${providerMetadata}`);
    const result = parseJsonModelOutput(text);
    if (!result) {
        throw new Error("Error with model response.");
    }
    return result;
}

export async function analyzeItem(api_key: string, item: itemSelect, search: searchSelect) {
    // ensure the properties exist
    // do quick check on ebay item titel
    const ai = google(api_key);
    const basicRes = await getScore(ai, item, search);
    let imageScore;
    if (basicRes.score > IMAGE_ANALYSIS_SCORE_THRESHOLD) {
        console.log("Item exceeded score threshold. Running image analysis");
        imageScore = await scoreImages(ai, item, search);
    }

    return {
        ...basicRes,
        // this is a placeholder for when i will actually have these attributes
        imageScore: imageScore?.score ?? null,
        imageReasoning: imageScore?.reasoning ?? null,
        model: ANALYSIS_MODEL,
    }
    //TODO this will get skipped on a score test after phase 2
    // if above basic threshold, do image analysis and add scoring to db
    // if not, add basic score attirbute
}
