import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, authorizeResourceAccess, handleApiError } from '@/lib/auth'
import type { PantryItem, UpdatePantryItemRequest, SuccessResponse } from '@/types/api'

// PATCH /api/pantry/[id] - Update a pantry item
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getUserId()
        if (!auth.success) return auth.response

        const { userId } = auth.data
        const { id } = await params
        const body: UpdatePantryItemRequest = await req.json()

        // Verify the pantry item belongs to the user
        const authResult = await authorizeResourceAccess(
            () => prisma.userFoodItem.findUnique({ where: { id } }),
            (item) => item.userId,
            userId,
            'Pantry item'
        )
        if (!authResult.success) return authResult.response

        // Update the pantry item
        const updatedItem = await prisma.userFoodItem.update({
            where: { id },
            data: {
                ...(body.foodItemId && { foodItemId: body.foodItemId }),
                ...(body.unitId && { unitId: body.unitId }),
                ...(body.quantity !== undefined && {
                    quantity: parseFloat(body.quantity.toString()),
                }),
                ...(body.purchaseDate && {
                    purchaseDate: new Date(body.purchaseDate),
                }),
                ...(body.estimatedExpirationDate !== undefined && {
                    estimatedExpirationDate: body.estimatedExpirationDate
                        ? new Date(body.estimatedExpirationDate)
                        : null,
                }),
            },
            include: {
                foodItem: true,
                unit: true,
            },
        })

        const response: PantryItem = {
            id: updatedItem.id,
            quantity: updatedItem.quantity,
            purchaseDate: updatedItem.purchaseDate.toISOString(),
            estimatedExpirationDate: updatedItem.estimatedExpirationDate?.toISOString() || null,
            foodItem: {
                id: updatedItem.foodItem.id,
                name: updatedItem.foodItem.name,
                category: updatedItem.foodItem.category,
                fdcId: updatedItem.foodItem.fdcId,
            },
            unit: {
                id: updatedItem.unit.id,
                shortName: updatedItem.unit.shortName,
                displayName: updatedItem.unit.displayName,
            },
        }

        return NextResponse.json(response)
    } catch (error) {
        return handleApiError(error, 'updating pantry item')
    }
}

// DELETE /api/pantry/[id] - Delete a pantry item
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await getUserId()
        if (!auth.success) return auth.response

        const { userId } = auth.data
        const { id } = await params

        // Verify the pantry item belongs to the user
        const authResult = await authorizeResourceAccess(
            () => prisma.userFoodItem.findUnique({ where: { id } }),
            (item) => item.userId,
            userId,
            'Pantry item'
        )
        if (!authResult.success) return authResult.response

        // Delete the pantry item
        await prisma.userFoodItem.delete({
            where: { id },
        })

        const response: SuccessResponse = { success: true }
        return NextResponse.json(response)
    } catch (error) {
        return handleApiError(error, 'deleting pantry item')
    }
}
