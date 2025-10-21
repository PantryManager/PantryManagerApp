import { NextResponse } from 'next/server'
import { getServerSession, Session } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { User } from '@/lib/generated/prisma'

/**
 * Success result with data
 */
export type SuccessResult<T> = {
    success: true
    data: T
}

/**
 * Error result with NextResponse
 */
export type ErrorResult = {
    success: false
    response: NextResponse
}

/**
 * Result type for auth operations
 */
export type AuthResult<T> = SuccessResult<T> | ErrorResult

/**
 * Authenticates the current request and returns the session
 *
 * @returns AuthResult with session if authenticated, or error response if not
 *
 * @example
 * const auth = await authenticateRequest()
 * if (!auth.success) return auth.response
 * const { session } = auth.data
 */
export async function authenticateRequest(): Promise<AuthResult<{ session: Session }>> {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return {
                success: false,
                response: NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }
        }

        return {
            success: true,
            data: { session }
        }
    } catch (error) {
        console.error('Authentication error:', error)
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            )
        }
    }
}

/**
 * Authenticates the current request and fetches the user from database
 *
 * @returns AuthResult with user if authenticated, or error response if not
 *
 * @example
 * const auth = await authenticateUser()
 * if (!auth.success) return auth.response
 * const { user } = auth.data
 */
export async function authenticateUser(): Promise<AuthResult<{ user: User }>> {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return {
                success: false,
                response: NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user) {
            return {
                success: false,
                response: NextResponse.json(
                    { error: 'User not found' },
                    { status: 404 }
                )
            }
        }

        return {
            success: true,
            data: { user }
        }
    } catch (error) {
        console.error('Authentication error:', error)
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            )
        }
    }
}

/**
 * Gets the authenticated user's ID from the session
 *
 * @returns AuthResult with userId if authenticated, or error response if not
 *
 * @example
 * const auth = await getUserId()
 * if (!auth.success) return auth.response
 * const { userId } = auth.data
 */
export async function getUserId(): Promise<AuthResult<{ userId: string }>> {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return {
                success: false,
                response: NextResponse.json(
                    { error: 'Unauthorized' },
                    { status: 401 }
                )
            }
        }

        return {
            success: true,
            data: { userId: session.user.id }
        }
    } catch (error) {
        console.error('Authentication error:', error)
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            )
        }
    }
}

/**
 * Verifies that a resource belongs to the authenticated user
 *
 * @param resourceUserId - The userId field from the resource being accessed
 * @param authenticatedUserId - The ID of the authenticated user
 * @returns AuthResult indicating success or forbidden error
 *
 * @example
 * const result = verifyResourceOwnership(item.userId, userId)
 * if (!result.success) return result.response
 */
export function verifyResourceOwnership(
    resourceUserId: string,
    authenticatedUserId: string
): AuthResult<Record<string, never>> {
    if (resourceUserId !== authenticatedUserId) {
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Forbidden' },
                { status: 403 }
            )
        }
    }

    return {
        success: true,
        data: {}
    }
}

/**
 * Generic function to authorize access to a resource
 * Fetches the resource and verifies ownership in one call
 *
 * @param fetchResource - Function that fetches the resource from database
 * @param getUserId - Function that extracts userId from the resource
 * @param authenticatedUserId - The ID of the authenticated user
 * @param resourceName - Name of resource for error messages (e.g., "Pantry item")
 * @returns AuthResult with resource if authorized, or error response if not
 *
 * @example
 * const result = await authorizeResourceAccess(
 *   () => prisma.userFoodItem.findUnique({ where: { id } }),
 *   (item) => item.userId,
 *   userId,
 *   "Pantry item"
 * )
 * if (!result.success) return result.response
 * const { resource } = result.data
 */
export async function authorizeResourceAccess<T>(
    fetchResource: () => Promise<T | null>,
    getUserIdFromResource: (resource: T) => string,
    authenticatedUserId: string,
    resourceName: string
): Promise<AuthResult<{ resource: T }>> {
    try {
        const resource = await fetchResource()

        if (!resource) {
            return {
                success: false,
                response: NextResponse.json(
                    { error: `${resourceName} not found` },
                    { status: 404 }
                )
            }
        }

        const resourceUserId = getUserIdFromResource(resource)
        const ownershipResult = verifyResourceOwnership(resourceUserId, authenticatedUserId)

        if (!ownershipResult.success) {
            return ownershipResult
        }

        return {
            success: true,
            data: { resource }
        }
    } catch (error) {
        console.error(`Error authorizing access to ${resourceName}:`, error)
        return {
            success: false,
            response: NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            )
        }
    }
}

/**
 * Wraps error handling for API routes
 *
 * @param error - The error that occurred
 * @param context - Context string for logging (e.g., "fetching pantry items")
 * @returns NextResponse with error message
 */
export function handleApiError(error: unknown, context: string): NextResponse {
    console.error(`Error ${context}:`, error)
    return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
    )
}
