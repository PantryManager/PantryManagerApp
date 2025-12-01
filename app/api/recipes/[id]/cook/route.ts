import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, authorizeResourceAccess, handleApiError } from '@/lib/auth'
import type { CookRecipeResponse } from '@/types/api'

// POST /api/recipes/[id]/cook - Cook a recipe (subtract ingredients from pantry)
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getUserId()
        if (!auth.success) return auth.response

        const { userId } = auth.data
        const { id } = await params

        // Verify the recipe belongs to the user
        const authResult = await authorizeResourceAccess(
            () =>
                prisma.recipe.findUnique({
                    where: { id },
                    include: { ingredients: true },
                }),
            (recipe) => recipe.userId,
            userId,
            'Recipe'
        )
        if (!authResult.success) return authResult.response

        const recipe = authResult.data.resource

        // Check if all ingredients are available in sufficient quantities
        const missingIngredients: string[] = []
        const insufficientIngredients: string[] = []

        for (const ingredient of recipe.ingredients) {
            if (!ingredient.userFoodItemId) {
                missingIngredients.push(ingredient.name)
                continue
            }

            const pantryItem = await prisma.userFoodItem.findUnique({
                where: { id: ingredient.userFoodItemId },
            })

            if (!pantryItem) {
                missingIngredients.push(ingredient.name)
            } else if (pantryItem.quantity < ingredient.quantityUsed) {
                insufficientIngredients.push(
                    `${ingredient.name} (have ${pantryItem.quantity} ${ingredient.unit}, need ${ingredient.quantityUsed} ${ingredient.unit})`
                )
            }
        }

        // If any ingredients are missing or insufficient, reject the request
        if (missingIngredients.length > 0 || insufficientIngredients.length > 0) {
            let message = 'Cannot cook this recipe: '
            if (missingIngredients.length > 0) {
                message += `Missing ingredients: ${missingIngredients.join(', ')}.`
            }
            if (insufficientIngredients.length > 0) {
                if (missingIngredients.length > 0) message += ' '
                message += `Insufficient quantities: ${insufficientIngredients.join(', ')}.`
            }

            const response: CookRecipeResponse = {
                success: false,
                message,
            }
            return NextResponse.json(response, { status: 400 })
        }

        // All ingredients are available, subtract them from pantry
        for (const ingredient of recipe.ingredients) {
            if (ingredient.userFoodItemId) {
                const pantryItem = await prisma.userFoodItem.findUnique({
                    where: { id: ingredient.userFoodItemId },
                })

                if (pantryItem) {
                    const newQuantity = pantryItem.quantity - ingredient.quantityUsed

                    if (newQuantity <= 0) {
                        // Delete the item if quantity reaches zero or below
                        await prisma.userFoodItem.delete({
                            where: { id: ingredient.userFoodItemId },
                        })
                    } else {
                        // Update the quantity
                        await prisma.userFoodItem.update({
                            where: { id: ingredient.userFoodItemId },
                            data: { quantity: newQuantity },
                        })
                    }
                }
            }
        }

        const response: CookRecipeResponse = {
            success: true,
            message: 'Recipe cooked successfully! Ingredients have been subtracted from your pantry.',
        }
        return NextResponse.json(response)
    } catch (error) {
        return handleApiError(error, 'cooking recipe')
    }
}
