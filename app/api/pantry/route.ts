import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, handleApiError } from '@/lib/auth'
import { getFoodLifespan } from '@/lib/llm/gemini'
import type { PantryItem, CreatePantryItemRequest } from '@/types/api'

// GET /api/pantry - Fetch all pantry items for the authenticated user
export async function GET() {
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

        const response: PantryItem[] = pantryItems.map((item) => ({
            id: item.id,
            quantity: item.quantity,
            purchaseDate: item.purchaseDate.toISOString(),
            estimatedExpirationDate:
                item.estimatedExpirationDate?.toISOString() || null,
            foodItem: {
                id: item.foodItem.id,
                name: item.foodItem.name,
                category: item.foodItem.category,
                fdcId: item.foodItem.fdcId,
            },
            unit: {
                id: item.unit.id,
                shortName: item.unit.shortName,
                displayName: item.unit.displayName,
            },
        }))

        return NextResponse.json(response)
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

        const body: CreatePantryItemRequest = await req.json()
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
        // Check if food item already exists in database
        let foodItem = await prisma.foodItem.findUnique({
            where: { fdcId: fdcId },
        })

        // If not found, create it from FDC search result data
        if (!foodItem) {
            foodItem = await prisma.foodItem.create({
                data: {
                    name: foodName,
                    fdcId: fdcId,
                    category: foodCategory,
                },
            })
        }

        const foodItemId = foodItem.id

        const parsedPurchaseDate = new Date(purchaseDate)
        const estimatedLifespan = await getFoodLifespan(foodName)
        if (!estimatedLifespan) throw Error("Couldn't estimate lifespan")

        const estimatedExpirationDate = new Date()
        estimatedExpirationDate.setDate(
            parsedPurchaseDate.getDate() + estimatedLifespan.duration
        )

        // Create the pantry item
        const pantryItem = await prisma.userFoodItem.create({
            data: {
                userId,
                foodItemId,
                unitId,
                quantity: parseFloat(quantity.toString()),
                purchaseDate: parsedPurchaseDate,
                estimatedExpirationDate: estimatedExpirationDate,
            },
            include: {
                foodItem: true,
                unit: true,
            },
        })

        const response: PantryItem = {
            id: pantryItem.id,
            quantity: pantryItem.quantity,
            purchaseDate: pantryItem.purchaseDate.toISOString(),
            estimatedExpirationDate:
                pantryItem.estimatedExpirationDate?.toISOString() || null,
            foodItem: {
                id: pantryItem.foodItem.id,
                name: pantryItem.foodItem.name,
                category: pantryItem.foodItem.category,
                fdcId: pantryItem.foodItem.fdcId,
            },
            unit: {
                id: pantryItem.unit.id,
                shortName: pantryItem.unit.shortName,
                displayName: pantryItem.unit.displayName,
            },
        }

        return NextResponse.json(response, { status: 201 })
    } catch (error) {
        return handleApiError(error, 'creating pantry item')
    }
}
