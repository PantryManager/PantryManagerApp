import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, handleApiError } from '@/lib/auth'
import { getFoodLifespan } from '@/lib/llm/gemini'

// GET /api/pantry - Fetch all pantry items for the authenticated user
export async function GET(req: NextRequest) {
    try {
        const auth = await getUserId()
        if (!auth.success) return auth.response

        const { userId } = auth.data

        const pantryItems = await prisma.userFoodItem.findMany({
            where: { userId },
            include: {
                foodItem: true,
                unit: true,
            },
            orderBy: [
                { estimatedExpirationDate: 'asc' },
                { purchaseDate: 'desc' },
            ],
        })

        return NextResponse.json(pantryItems)
    } catch (error) {
        return handleApiError(error, 'fetching pantry items')
    }
}

// POST /api/pantry - Add a new pantry item
export async function POST(req: NextRequest) {
    try {
        const auth = await getUserId()
        if (!auth.success) return auth.response

        const { userId } = auth.data

        const body = await req.json()
        const {
            fdcId,
            foodName,
            foodCategory,
            unitId,
            quantity,
            purchaseDate,
        } = body

        // Validate required fields
        if (
            !fdcId ||
            !foodName ||
            !foodCategory ||
            !unitId ||
            !quantity ||
            !purchaseDate
        ) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        let foodItemId: string

        // Check if food item already exists in database
        let foodItem = await prisma.foodItem.findUnique({
            where: { fdcId: parseInt(fdcId) },
        })

        // If not found, create it from FDC search result data
        if (!foodItem) {
            foodItem = await prisma.foodItem.create({
                data: {
                    name: foodName,
                    fdcId: parseInt(fdcId),
                    category: foodCategory,
                },
            })
        }

        foodItemId = foodItem.id

        let parsedPurchaseDate = new Date(purchaseDate);
        let estimatedLifespan = await getFoodLifespan(foodName)
        if(!estimatedLifespan) throw Error("Couldn't estimate lifespan");

        let estimatedExpirationDate = new Date();
        estimatedExpirationDate.setDate(parsedPurchaseDate.getDate() + estimatedLifespan.duration);

        // Create the pantry item
        const pantryItem = await prisma.userFoodItem.create({
            data: {
                userId,
                foodItemId,
                unitId,
                quantity: parseFloat(quantity),
                purchaseDate: parsedPurchaseDate,
                estimatedExpirationDate: estimatedExpirationDate
            },
            include: {
                foodItem: true,
                unit: true,
            },
        })

        return NextResponse.json(pantryItem, { status: 201 })
    } catch (error) {
        return handleApiError(error, 'creating pantry item')
    }
}
