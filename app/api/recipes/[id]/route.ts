import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserId, authorizeResourceAccess, handleApiError } from '@/lib/auth'
import type { SuccessResponse } from '@/types/api'

// DELETE /api/recipes/[id] - Delete a recipe
export async function DELETE(
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
            () => prisma.recipe.findUnique({ where: { id } }),
            (recipe) => recipe.userId,
            userId,
            'Recipe'
        )
        if (!authResult.success) return authResult.response

        // Delete the recipe (ingredients will cascade delete)
        await prisma.recipe.delete({
            where: { id },
        })

        const response: SuccessResponse = { success: true }
        return NextResponse.json(response)
    } catch (error) {
        return handleApiError(error, 'deleting recipe')
    }
}
