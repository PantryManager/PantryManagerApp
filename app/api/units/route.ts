import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, handleApiError } from '@/lib/auth'
import type { Unit } from '@/types/api'

// GET /api/units - Fetch all available units
export async function GET() {
    try {
        const auth = await authenticateRequest()
        if (!auth.success) return auth.response

        const units = await prisma.unit.findMany({
            orderBy: { displayName: 'asc' },
        })

        const response: Unit[] = units.map((unit) => ({
            id: unit.id,
            shortName: unit.shortName,
            displayName: unit.displayName,
        }))

        return NextResponse.json(response)
    } catch (error) {
        return handleApiError(error, 'fetching units')
    }
}
