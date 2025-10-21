import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, handleApiError } from '@/lib/auth'

// GET /api/food-items/search?q=query - Search FDC API for food items
export async function GET(req: NextRequest) {
    try {
        const auth = await authenticateRequest()
        if (!auth.success) return auth.response

        const searchParams = req.nextUrl.searchParams
        const query = searchParams.get('q')

        if (!query || query.trim().length < 2) {
            return NextResponse.json(
                { error: 'Query must be at least 2 characters' },
                { status: 400 }
            )
        }

        const apiKey = process.env.FDC_API_KEY

        if (!apiKey) {
            console.error('FDC_API_KEY not configured')
            return NextResponse.json(
                { error: 'FDC API not configured' },
                { status: 500 }
            )
        }

        // Search FDC API
        const fdcUrl = new URL('https://api.nal.usda.gov/fdc/v1/foods/search')
        fdcUrl.searchParams.set('api_key', apiKey)
        fdcUrl.searchParams.set('query', query)
        fdcUrl.searchParams.set('pageSize', '20')
        fdcUrl.searchParams.set('dataType', 'Foundation,SR Legacy,Survey (FNDDS),Branded')

        const response = await fetch(fdcUrl.toString())

        if (!response.ok) {
            console.error('FDC API error:', response.status, response.statusText)
            return NextResponse.json(
                { error: 'Failed to search FDC API' },
                { status: response.status }
            )
        }

        const data = await response.json()

        // Transform FDC results to our format
        const results = data.foods?.map((food: any) => ({
            fdcId: food.fdcId,
            name: food.description,
            category: food.foodCategory || food.brandOwner || 'Uncategorized',
            dataType: food.dataType,
            brandOwner: food.brandOwner,
        })) || []

        return NextResponse.json({ results, totalHits: data.totalHits })
    } catch (error) {
        return handleApiError(error, 'searching food items')
    }
}
