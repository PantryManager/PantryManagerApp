import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { authenticateRequest, handleApiError } from '@/lib/auth'

// GET /api/units - Fetch all available units
export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest()
        if (!auth.success) return auth.response

        const units = await prisma.unit.findMany({
            orderBy: { displayName: 'asc' },
        })

        return NextResponse.json(units)
    } catch (error) {
        return handleApiError(error, 'fetching units')
    }
}
