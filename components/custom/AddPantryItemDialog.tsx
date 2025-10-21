'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'

interface Unit {
    id: string
    shortName: string
    displayName: string
}

interface FDCSearchResult {
    fdcId: number
    name: string
    category: string
    dataType: string
    brandOwner?: string
}

interface AddPantryItemDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onItemAdded: (item: any) => void
}

export function AddPantryItemDialog({
    open,
    onOpenChange,
    onItemAdded,
}: AddPantryItemDialogProps) {
    const [units, setUnits] = useState<Unit[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState<FDCSearchResult[]>([])
    const [searching, setSearching] = useState(false)
    const [selectedFood, setSelectedFood] = useState<FDCSearchResult | null>(null)

    // Form fields
    const [customFoodName, setCustomFoodName] = useState('')
    const [unitId, setUnitId] = useState('')
    const [quantity, setQuantity] = useState('1')
    const [purchaseDate, setPurchaseDate] = useState(
        new Date().toISOString().split('T')[0]
    )
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            fetchUnits()
            // Reset form
            setSearchQuery('')
            setSearchResults([])
            setSelectedFood(null)
            setCustomFoodName('')
            setUnitId('')
            setQuantity('1')
            setPurchaseDate(new Date().toISOString().split('T')[0])
        }
    }, [open])

    const fetchUnits = async () => {
        try {
            const response = await fetch('/api/units')
            if (response.ok) {
                const data = await response.json()
                setUnits(data)
            }
        } catch (error) {
            console.error('Error fetching units:', error)
        }
    }

    const handleSearch = async () => {
        if (searchQuery.trim().length < 2) {
            return
        }

        try {
            setSearching(true)
            const response = await fetch(
                `/api/food-items/search?q=${encodeURIComponent(searchQuery)}`
            )
            if (response.ok) {
                const data = await response.json()
                setSearchResults(data.results || [])
            } else {
                console.error('Failed to search food items')
            }
        } catch (error) {
            console.error('Error searching food items:', error)
        } finally {
            setSearching(false)
        }
    }

    const handleSelectFood = (food: FDCSearchResult) => {
        setSelectedFood(food)
        // Extract a cleaner name by removing brand info if present
        const cleanName = food.name.split(',')[0].trim()
        setCustomFoodName(cleanName)
        setSearchResults([])
        setSearchQuery('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedFood || !customFoodName.trim() || !unitId || !quantity || !purchaseDate) {
            alert('Please fill in all required fields')
            return
        }

        try {
            setSubmitting(true)
            const response = await fetch('/api/pantry', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fdcId: selectedFood.fdcId,
                    foodName: customFoodName.trim(),
                    foodCategory: selectedFood.category,
                    unitId,
                    quantity: parseFloat(quantity),
                    purchaseDate,
                    estimatedExpirationDate: null, // TODO: AI will estimate this
                }),
            })

            if (response.ok) {
                const newItem = await response.json()
                onItemAdded(newItem)
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            console.error('Error adding pantry item:', error)
            alert('Failed to add pantry item')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Add Pantry Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Food Search */}
                    <div className="space-y-2">
                        <Label htmlFor="search">Search Food Item</Label>
                        <div className="flex gap-2">
                            <Input
                                id="search"
                                placeholder="Search for food (e.g., chicken breast, milk)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        handleSearch()
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                onClick={handleSearch}
                                disabled={searching || searchQuery.trim().length < 2}
                            >
                                <Search className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="border rounded-md max-h-60 overflow-y-auto">
                                {searchResults.map((result) => (
                                    <button
                                        key={result.fdcId}
                                        type="button"
                                        onClick={() => handleSelectFood(result)}
                                        className="w-full text-left px-3 py-2 hover:bg-accent border-b last:border-b-0"
                                    >
                                        <div className="font-medium">{result.name}</div>
                                        <div className="text-sm text-muted-foreground">
                                            {result.category}
                                            {result.brandOwner && ` • ${result.brandOwner}`}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Selected Food */}
                        {selectedFood && (
                            <div className="border rounded-md p-3 bg-accent/50">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Selected from FDC:
                                        </div>
                                        <div className="font-medium text-sm">{selectedFood.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {selectedFood.category}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setSelectedFood(null)
                                            setCustomFoodName('')
                                        }}
                                    >
                                        Change
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Custom Food Name */}
                    {selectedFood && (
                        <div className="space-y-2">
                            <Label htmlFor="customName">
                                Custom Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="customName"
                                placeholder="e.g., Whole Milk, Chicken Breast, etc."
                                value={customFoodName}
                                onChange={(e) => setCustomFoodName(e.target.value)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Give this item a custom name (e.g., &quot;Whole Milk&quot; instead of the full FDC name)
                            </p>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input
                                id="quantity"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Select value={unitId} onValueChange={setUnitId}>
                                <SelectTrigger id="unit">
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((unit) => (
                                        <SelectItem key={unit.id} value={unit.id}>
                                            {unit.displayName} ({unit.shortName})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Purchase Date */}
                    <div className="space-y-2">
                        <Label htmlFor="purchaseDate">Purchase Date</Label>
                        <Input
                            id="purchaseDate"
                            type="date"
                            value={purchaseDate}
                            onChange={(e) => setPurchaseDate(e.target.value)}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!selectedFood || submitting}>
                            {submitting ? 'Adding...' : 'Add to Pantry'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
