import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, handleApiError } from '@/lib/auth'
import type { SaveRecipeRequest, SavedRecipe } from '@/types/api'

// GET /api/recipes - Get all saved recipes for the user
export async function GET() {
    try {
        const auth = await getUserId()
        if (!auth.success) return auth.response

        const { userId } = auth.data

        const recipes = await prisma.recipe.findMany({
            where: { userId },
            include: {
                ingredients: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        const response: SavedRecipe[] = recipes.map((recipe) => ({
            id: recipe.id,
            title: recipe.title,
            description: recipe.description,
            servings: recipe.servings,
            prepTime: recipe.prepTime,
            cookTime: recipe.cookTime,
            steps: recipe.steps,
            createdAt: recipe.createdAt.toISOString(),
            ingredients: recipe.ingredients.map((ingredient) => ({
                id: ingredient.id,
                name: ingredient.name,
                fdcId: ingredient.fdcId,
                quantityUsed: ingredient.quantityUsed,
                unit: ingredient.unit,
                userFoodItemId: ingredient.userFoodItemId,
            })),
        }))

        return NextResponse.json(response)
    } catch (error) {
        return handleApiError(error, 'fetching recipes')
    }
}

// POST /api/recipes - Save a new recipe
export async function POST(req: NextRequest) {
    try {
        const auth = await getUserId()
        if (!auth.success) return auth.response

        const { userId } = auth.data
        const body: SaveRecipeRequest = await req.json()
        const { recipe } = body

        // Create the recipe with ingredients
        const savedRecipe = await prisma.recipe.create({
            data: {
                userId,
                title: recipe.title,
                description: recipe.description || null,
                servings: recipe.servings || null,
                prepTime: recipe.prepTime || null,
                cookTime: recipe.cookTime || null,
                steps: recipe.steps,
                ingredients: {
                    create: recipe.usedIngredients.map((ingredient) => ({
                        userFoodItemId: ingredient.userFoodItemId,
                        fdcId: ingredient.fdcId,
                        name: ingredient.name,
                        quantityUsed: ingredient.quantityUsed,
                        unit: ingredient.unit,
                    })),
                },
            },
            include: {
                ingredients: true,
            },
        })

        const response: SavedRecipe = {
            id: savedRecipe.id,
            title: savedRecipe.title,
            description: savedRecipe.description,
            servings: savedRecipe.servings,
            prepTime: savedRecipe.prepTime,
            cookTime: savedRecipe.cookTime,
            steps: savedRecipe.steps,
            createdAt: savedRecipe.createdAt.toISOString(),
            ingredients: savedRecipe.ingredients.map((ingredient) => ({
                id: ingredient.id,
                name: ingredient.name,
                fdcId: ingredient.fdcId,
                quantityUsed: ingredient.quantityUsed,
                unit: ingredient.unit,
                userFoodItemId: ingredient.userFoodItemId,
            })),
        }

        return NextResponse.json(response)
    } catch (error) {
        return handleApiError(error, 'saving recipe')
    }
}
