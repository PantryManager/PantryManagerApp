'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AddPantryItemDialog } from '@/components/custom/AddPantryItemDialog'
import { Spinner } from '@/components/ui/spinner'

interface PantryItem {
    id: string
    quantity: number
    purchaseDate: string
    estimatedExpirationDate: string | null
    foodItem: {
        id: string
        name: string
        category: string
        fdcId: number | null
    }
    unit: {
        id: string
        shortName: string
        displayName: string
    }
}

export default function PantryPage() {
    const { data: session, status } = useSession()
    const router = useRouter()
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchPantryItems()
        }
    }, [status])

    const fetchPantryItems = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/pantry')
            if (response.ok) {
                const data = await response.json()
                console.log('response: ', JSON.stringify(response))
                console.log(JSON.stringify(data))
                setPantryItems(data)
            } else {
                console.log(JSON.stringify(response))
                console.error('Failed to fetch pantry items')
            }
        } catch (error) {
            console.error('Error fetching pantry items:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this item?')) {
            return
        }

        try {
            const response = await fetch(`/api/pantry/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                setPantryItems(pantryItems.filter((item) => item.id !== id))
            } else {
                console.error('Failed to delete item')
            }
        } catch (error) {
            console.error('Error deleting item:', error)
        }
    }

    const handleItemAdded = (newItem: PantryItem) => {
        setPantryItems([...pantryItems, newItem])
        setIsDialogOpen(false)
    }

    const getExpirationBadge = (expirationDate: string | null) => {
        if (!expirationDate) {
            return <Badge variant="secondary">No expiration</Badge>
        }

        const daysUntilExpiration = Math.floor(
            (new Date(expirationDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24)
        )

        if (daysUntilExpiration < 0) {
            return <Badge variant="destructive">Expired</Badge>
        } else if (daysUntilExpiration <= 3) {
            return <Badge variant="destructive">Expires soon</Badge>
        } else if (daysUntilExpiration <= 7) {
            return (
                <Badge className="bg-yellow-500">
                    Expires in {daysUntilExpiration} days
                </Badge>
            )
        } else {
            return (
                <Badge variant="secondary">
                    Expires in {daysUntilExpiration} days
                </Badge>
            )
        }
    }

    if (status === 'loading' || loading) {
        return (
            <AppLayout>
                <Spinner className="size-8" />
            </AppLayout>
        )
    }

    if (status === 'unauthenticated') {
        return null
    }

    return (
        <AppLayout maxWidth="2xl">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>My Pantry</CardTitle>
                    <Button onClick={() => setIsDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                    </Button>
                </CardHeader>
                <CardContent>
                    {pantryItems.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>Your pantry is empty.</p>
                            <p className="text-sm mt-2">
                                Click &quot;Add Item&quot; to get started.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Food Item</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Purchase Date</TableHead>
                                    <TableHead>Expiration</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pantryItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">
                                            {item.foodItem.name}
                                        </TableCell>
                                        <TableCell>
                                            {item.foodItem.category}
                                        </TableCell>
                                        <TableCell>
                                            {item.quantity}{' '}
                                            {item.unit.shortName}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(
                                                item.purchaseDate
                                            ).toLocaleDateString('en-US', {
                                                timeZone: 'UTC',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            {getExpirationBadge(
                                                item.estimatedExpirationDate
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleDelete(item.id)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AddPantryItemDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onItemAdded={handleItemAdded}
            />
        </AppLayout>
    )
}
