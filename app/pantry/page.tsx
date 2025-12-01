'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChefHat, Pencil } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AddPantryItemDialog } from '@/components/custom/AddPantryItemDialog'
import { RecipeDialog } from '@/components/custom/RecipeDialog'
import { Spinner } from '@/components/ui/spinner'
import type {
    PantryItem,
    SuccessResponse,
    GenerateRecipeRequest,
    GenerateRecipeResponse,
    GeneratedRecipe,
    UpdatePantryItemRequest,
} from '@/types/api'

export default function PantryPage() {
    const { status } = useSession()
    const router = useRouter()
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set())
    const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
    const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipe | null>(null)
    const [generatingRecipe, setGeneratingRecipe] = useState(false)
    const [editingItemId, setEditingItemId] = useState<string | null>(null)
    const [newExpirationDate, setNewExpirationDate] = useState<string>('')
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

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
                const data: PantryItem[] = await response.json()
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
                const data: SuccessResponse = await response.json()
                if (data.success) {
                    setPantryItems(pantryItems.filter((item) => item.id !== id))
                }
            } else {
                console.error('Failed to delete item')
            }
        } catch (error) {
            console.error('Error deleting item:', error)
        }
    }

    const handleBulkDelete = async () => {
        if (selectedItemIds.size === 0) return

        const itemCount = selectedItemIds.size
        if (!confirm(`Are you sure you want to delete ${itemCount} item${itemCount > 1 ? 's' : ''}?`)) {
            return
        }

        try {
            const deletePromises = Array.from(selectedItemIds).map((id) =>
                fetch(`/api/pantry/${id}`, {
                    method: 'DELETE',
                })
            )

            const results = await Promise.all(deletePromises)
            const successfulDeletes = results.filter((response) => response.ok)

            if (successfulDeletes.length > 0) {
                setPantryItems(pantryItems.filter((item) => !selectedItemIds.has(item.id)))
                setSelectedItemIds(new Set())
            }

            if (successfulDeletes.length < results.length) {
                console.error('Some items failed to delete')
            }
        } catch (error) {
            console.error('Error deleting items:', error)
        }
    }

    const handleItemAdded = (newItem: PantryItem) => {
        setPantryItems([...pantryItems, newItem])
        setIsDialogOpen(false)
    }

    const toggleItemSelection = (itemId: string) => {
        setSelectedItemIds((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(itemId)) {
                newSet.delete(itemId)
            } else {
                newSet.add(itemId)
            }
            return newSet
        })
    }

    const toggleSelectAll = () => {
        if (selectedItemIds.size === pantryItems.length) {
            setSelectedItemIds(new Set())
        } else {
            setSelectedItemIds(new Set(pantryItems.map((item) => item.id)))
        }
    }

    const handleGenerateRecipe = async () => {
        if (selectedItemIds.size === 0) return

        try {
            setGeneratingRecipe(true)
            setIsRecipeDialogOpen(true)

            // Get selected items sorted by expiration date (soonest first)
            const selectedItems = pantryItems
                .filter((item) => selectedItemIds.has(item.id))
                .sort((a, b) => {
                    // Items without expiration dates go to the end
                    if (!a.estimatedExpirationDate && !b.estimatedExpirationDate)
                        return 0
                    if (!a.estimatedExpirationDate) return 1
                    if (!b.estimatedExpirationDate) return -1
                    return (
                        new Date(a.estimatedExpirationDate).getTime() -
                        new Date(b.estimatedExpirationDate).getTime()
                    )
                })

            const requestBody: GenerateRecipeRequest = {
                ingredients: selectedItems.map((item) => ({
                    userFoodItemId: item.id,
                    fdcId: item.foodItem.fdcId || 0,
                    name: item.foodItem.name,
                    quantity: item.quantity,
                    unit: item.unit.shortName,
                })),
            }

            const response = await fetch('/api/recipes/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })

            if (response.ok) {
                const data: GenerateRecipeResponse = await response.json()
                setGeneratedRecipe(data.recipe)
            } else {
                console.error('Failed to generate recipe')
                alert('Failed to generate recipe. Please try again.')
                setIsRecipeDialogOpen(false)
            }
        } catch (error) {
            console.error('Error generating recipe:', error)
            alert('Failed to generate recipe. Please try again.')
            setIsRecipeDialogOpen(false)
        } finally {
            setGeneratingRecipe(false)
        }
    }

    const handleAcceptRecipe = (recipe: GeneratedRecipe) => {
        // TODO: Future implementation - update pantry by subtracting used ingredients
        console.log('Recipe accepted:', recipe)
        alert('Recipe acceptance feature coming soon!')
    }

    const handleEditExpirationDate = (item: PantryItem) => {
        setEditingItemId(item.id)
        // Convert ISO date to YYYY-MM-DD format for input[type="date"]
        if (item.estimatedExpirationDate) {
            const date = new Date(item.estimatedExpirationDate)
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
            setNewExpirationDate(localDate.toISOString().split('T')[0])
        } else {
            setNewExpirationDate('')
        }
        setIsEditDialogOpen(true)
    }

    const handleSaveExpirationDate = async () => {
        if (!editingItemId) return

        try {
            const requestBody: UpdatePantryItemRequest = {
                estimatedExpirationDate: newExpirationDate || null,
            }

            const response = await fetch(`/api/pantry/${editingItemId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            })

            if (response.ok) {
                const updatedItem: PantryItem = await response.json()
                setPantryItems(
                    pantryItems.map((item) =>
                        item.id === editingItemId ? updatedItem : item
                    )
                )
                setIsEditDialogOpen(false)
                setEditingItemId(null)
                setNewExpirationDate('')
            } else {
                console.error('Failed to update expiration date')
                alert('Failed to update expiration date. Please try again.')
            }
        } catch (error) {
            console.error('Error updating expiration date:', error)
            alert('Failed to update expiration date. Please try again.')
        }
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
                    <div className="flex gap-2">
                        {selectedItemIds.size > 0 && (
                            <>
                                <Button
                                    onClick={handleBulkDelete}
                                    variant="destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected ({selectedItemIds.size})
                                </Button>
                                <Button
                                    onClick={handleGenerateRecipe}
                                    variant="default"
                                    disabled={generatingRecipe}
                                >
                                    <ChefHat className="mr-2 h-4 w-4" />
                                    Generate Recipe ({selectedItemIds.size})
                                </Button>
                            </>
                        )}
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                        </Button>
                    </div>
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
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={
                                                selectedItemIds.size ===
                                                    pantryItems.length &&
                                                pantryItems.length > 0
                                            }
                                            onCheckedChange={toggleSelectAll}
                                            aria-label="Select all"
                                        />
                                    </TableHead>
                                    <TableHead>Food Item</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Purchase Date</TableHead>
                                    <TableHead>Expiration</TableHead>
                                    <TableHead className="w-16">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pantryItems.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedItemIds.has(item.id)}
                                                onCheckedChange={() =>
                                                    toggleItemSelection(item.id)
                                                }
                                                aria-label={`Select ${item.foodItem.name}`}
                                            />
                                        </TableCell>
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
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEditExpirationDate(item)}
                                                className="h-8 w-8"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
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

            <RecipeDialog
                open={isRecipeDialogOpen}
                onOpenChange={setIsRecipeDialogOpen}
                recipe={generatedRecipe}
                loading={generatingRecipe}
                onAcceptRecipe={handleAcceptRecipe}
            />

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Expiration Date</DialogTitle>
                        <DialogDescription>
                            Update the expiration date for this item. Leave empty to remove the expiration date.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="expirationDate">Expiration Date</Label>
                            <Input
                                id="expirationDate"
                                type="date"
                                value={newExpirationDate}
                                onChange={(e) => setNewExpirationDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveExpirationDate}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    )
}
