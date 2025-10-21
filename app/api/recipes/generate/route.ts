import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, handleApiError } from '@/lib/auth'
import { generateRecipe } from '@/lib/llm/gemini'
import type {
    GenerateRecipeRequest,
    GenerateRecipeResponse,
} from '@/types/api'

// POST /api/recipes/generate - Generate a recipe based on selected ingredients
export async function POST(req: NextRequest) {
    try {
        const auth = await authenticateRequest()
        if (!auth.success) return auth.response

        const body: GenerateRecipeRequest = await req.json()
        const { ingredients } = body

        // Validate required fields
        if (!ingredients || ingredients.length === 0) {
            return NextResponse.json(
                { error: 'At least one ingredient is required' },
                { status: 400 }
            )
        }

        // Sort ingredients by priority (items expiring soonest should already be sorted by client)
        // Generate recipe using Gemini
        const result = await generateRecipe(ingredients)

        const response: GenerateRecipeResponse = {
            recipe: result,
        }

        return NextResponse.json(response)
    } catch (error) {
        return handleApiError(error, 'generating recipe')
    }
}
