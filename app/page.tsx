'use client'

import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, Calendar, AlertCircle, TrendingUp } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import type { PantryItem } from '@/types/api'

export default function Home() {
    const { data: session } = useSession()
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (session) {
            fetchPantryItems()
        }
    }, [session])

    const fetchPantryItems = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/pantry')
            if (response.ok) {
                const data: PantryItem[] = await response.json()
                setPantryItems(data)
            } else {
                console.error('Failed to fetch pantry items')
            }
        } catch (error) {
            console.error('Error fetching pantry items:', error)
        } finally {
            setLoading(false)
        }
    }

    const getTotalItems = () => {
        return pantryItems.length
    }

    const getExpiringSoon = () => {
        const now = new Date()
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        return pantryItems.filter((item) => {
            if (!item.estimatedExpirationDate) return false
            const expirationDate = new Date(item.estimatedExpirationDate)
            return expirationDate > now && expirationDate <= sevenDaysFromNow
        }).length
    }

    const getExpired = () => {
        const now = new Date()
        return pantryItems.filter((item) => {
            if (!item.estimatedExpirationDate) return false
            const expirationDate = new Date(item.estimatedExpirationDate)
            return expirationDate < now
        }).length
    }

    const getUniqueCategories = () => {
        const categories = new Set(pantryItems.map((item) => item.foodItem.category))
        return categories.size
    }

    return (
        <AppLayout maxWidth="lg">
            <div className="space-y-8">
                <div>
                    <h1 className="text-4xl font-bold mb-2">Welcome to Pantry Manager</h1>
                    <p className="text-lg text-muted-foreground">
                        {session
                            ? `Hello, ${session.user?.name || 'there'}! Manage your pantry inventory with ease.`
                            : 'Sign in to start managing your pantry inventory.'}
                    </p>
                </div>

                {session && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Items
                                </CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '-' : getTotalItems()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    In your pantry
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Expiring Soon
                                </CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '-' : getExpiringSoon()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Within 7 days
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Expired</CardTitle>
                                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '-' : getExpired()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Need attention
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Categories
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {loading ? '-' : getUniqueCategories()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Food categories
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Getting Started</CardTitle>
                        <CardDescription>
                            Learn how to use Pantry Manager effectively
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                1
                            </div>
                            <div>
                                <h3 className="font-semibold">Add Items to Your Pantry</h3>
                                <p className="text-sm text-muted-foreground">
                                    Navigate to the Pantry page and click &quot;Add Item&quot; to start
                                    tracking your food inventory.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                2
                            </div>
                            <div>
                                <h3 className="font-semibold">Track Expiration Dates</h3>
                                <p className="text-sm text-muted-foreground">
                                    Set expiration dates to get visual warnings about items
                                    expiring soon.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                3
                            </div>
                            <div>
                                <h3 className="font-semibold">Manage Your Inventory</h3>
                                <p className="text-sm text-muted-foreground">
                                    Update quantities, delete consumed items, and keep your
                                    pantry up to date.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    )
}
