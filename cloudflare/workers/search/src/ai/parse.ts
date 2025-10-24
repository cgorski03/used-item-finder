import { ModelScoreResponse } from "./system"

// Get AI response to usable JSON 
export const parseJsonModelOutput = (
    jsonOutput: string,
): ModelScoreResponse | undefined => {
    try {
        // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
        let cleanedOutput = jsonOutput.trim()
        const codeBlockMatch = cleanedOutput.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (codeBlockMatch) {
            cleanedOutput = codeBlockMatch[1].trim()
        }

        // Try to extract JSON object if there's extra text around it
        const jsonMatch = cleanedOutput.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
            cleanedOutput = jsonMatch[0]
        }

        const output = JSON.parse(cleanedOutput)

        // Validate structure
        if (typeof output !== "object" || output === null) {
            console.error("Model response is not an object:", output)
            return undefined
        }

        // Validate score field
        if (typeof output.score !== "number") {
            console.error(
                "Model response missing or invalid 'score' field:",
                output,
            )
            return undefined
        }

        if (output.score < 0 || output.score > 100) {
            console.error(
                `Model response 'score' out of range (0-100): ${output.score}`,
            )
            return undefined
        }

        // Validate reasoning field
        if (typeof output.reasoning !== "string") {
            console.error(
                "Model response missing or invalid 'reasoning' field:",
                output,
            )
            return undefined
        }

        if (output.reasoning.trim().length === 0) {
            console.error("Model response 'reasoning' field is empty")
            return undefined
        }

        return {
            score: Math.round(output.score), // Ensure it's an integer
            reasoning: output.reasoning.trim(),
        }
    } catch (error: any) {
        console.error("Error parsing JSON from model response:", error.message)
        console.error("Raw output:", jsonOutput)
        return undefined
    }
}

