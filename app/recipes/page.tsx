'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Trash2, ChefHat, Clock, Users } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { toast } from 'sonner'
import type { SavedRecipe, SuccessResponse, CookRecipeResponse } from '@/types/api'

export default function RecipesPage() {
    const { status } = useSession()
    const router = useRouter()
    const [recipes, setRecipes] = useState<SavedRecipe[]>([])
    const [loading, setLoading] = useState(true)
    const [cookingRecipeId, setCookingRecipeId] = useState<string | null>(null)
    const [viewingRecipe, setViewingRecipe] = useState<SavedRecipe | null>(null)
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/')
        }
    }, [status, router])

    useEffect(() => {
        if (status === 'authenticated') {
            fetchRecipes()
        }
    }, [status])

    const fetchRecipes = async () => {
        try {
            setLoading(true)
            const response = await fetch('/api/recipes')
            if (response.ok) {
                const data: SavedRecipe[] = await response.json()
                setRecipes(data)
            } else {
                console.error('Failed to fetch recipes')
            }
        } catch (error) {
            console.error('Error fetching recipes:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Are you sure you want to delete "${title}"?`)) {
            return
        }

        try {
            const response = await fetch(`/api/recipes/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                const data: SuccessResponse = await response.json()
                if (data.success) {
                    setRecipes(recipes.filter((recipe) => recipe.id !== id))
                    toast.success('Recipe deleted successfully')
                }
            } else {
                console.error('Failed to delete recipe')
                toast.error('Failed to delete recipe')
            }
        } catch (error) {
            console.error('Error deleting recipe:', error)
            toast.error('Failed to delete recipe')
        }
    }

    const handleCook = async (id: string, title: string) => {
        try {
            setCookingRecipeId(id)
            const response = await fetch(`/api/recipes/${id}/cook`, {
                method: 'POST',
            })

            const data: CookRecipeResponse = await response.json()

            if (response.ok && data.success) {
                toast.success(data.message || 'Recipe cooked successfully!')
                // Refresh the page to update pantry items
                setTimeout(() => {
                    window.location.reload()
                }, 2000)
            } else {
                toast.error(data.message || 'Failed to cook recipe', {
                    duration: 5000,
                })
            }
        } catch (error) {
            console.error('Error cooking recipe:', error)
            toast.error('Failed to cook recipe')
        } finally {
            setCookingRecipeId(null)
        }
    }

    const handleViewRecipe = (recipe: SavedRecipe) => {
        setViewingRecipe(recipe)
        setIsViewDialogOpen(true)
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
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">My Recipes</h1>
                    <p className="text-muted-foreground mt-2">
                        View and manage your saved recipes
                    </p>
                </div>

                {recipes.length === 0 ? (
                    <Card>
                        <CardContent className="py-12">
                            <div className="text-center text-muted-foreground">
                                <p>You haven&apos;t saved any recipes yet.</p>
                                <p className="text-sm mt-2">
                                    Generate a recipe from your pantry items to get started!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {recipes.map((recipe) => (
                            <Card key={recipe.id} className="flex flex-col">
                                <CardHeader
                                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                                    onClick={() => handleViewRecipe(recipe)}
                                >
                                    <CardTitle className="line-clamp-2">
                                        {recipe.title}
                                    </CardTitle>
                                    {recipe.description && (
                                        <CardDescription className="line-clamp-2">
                                            {recipe.description}
                                        </CardDescription>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1 space-y-4">
                                    <div className="cursor-pointer" onClick={() => handleViewRecipe(recipe)}>
                                    <div className="space-y-2">
                                        {recipe.servings && (
                                            <p className="text-sm">
                                                <span className="font-medium">Servings:</span>{' '}
                                                {recipe.servings}
                                            </p>
                                        )}
                                        {recipe.prepTime && (
                                            <p className="text-sm">
                                                <span className="font-medium">Prep Time:</span>{' '}
                                                {recipe.prepTime}
                                            </p>
                                        )}
                                        {recipe.cookTime && (
                                            <p className="text-sm">
                                                <span className="font-medium">Cook Time:</span>{' '}
                                                {recipe.cookTime}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="font-medium text-sm mb-2">Ingredients:</h4>
                                        <ul className="text-sm space-y-1 text-muted-foreground">
                                            {recipe.ingredients.map((ingredient) => (
                                                <li key={ingredient.id}>
                                                    {ingredient.quantityUsed} {ingredient.unit}{' '}
                                                    {ingredient.name}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    </div>
                                    <div className="flex gap-2 pt-4">
                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleCook(recipe.id, recipe.title)
                                            }}
                                            disabled={cookingRecipeId === recipe.id}
                                            className="flex-1"
                                        >
                                            <ChefHat className="mr-2 h-4 w-4" />
                                            {cookingRecipeId === recipe.id ? 'Cooking...' : 'Cook'}
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            size="icon"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDelete(recipe.id, recipe.title)
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* View Recipe Dialog */}
            {viewingRecipe && (
                <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                    <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{viewingRecipe.title}</DialogTitle>
                            {viewingRecipe.description && (
                                <p className="text-muted-foreground mt-2">
                                    {viewingRecipe.description}
                                </p>
                            )}
                        </DialogHeader>

                        <div className="space-y-6">
                            {/* Recipe Metadata */}
                            {(viewingRecipe.servings || viewingRecipe.prepTime || viewingRecipe.cookTime) && (
                                <div className="flex flex-wrap gap-4">
                                    {viewingRecipe.servings && (
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                {viewingRecipe.servings} servings
                                            </span>
                                        </div>
                                    )}
                                    {viewingRecipe.prepTime && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Prep: {viewingRecipe.prepTime}
                                            </span>
                                        </div>
                                    )}
                                    {viewingRecipe.cookTime && (
                                        <div className="flex items-center gap-2">
                                            <ChefHat className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm">
                                                Cook: {viewingRecipe.cookTime}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Ingredients */}
                            {viewingRecipe.ingredients.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 text-lg">
                                        Ingredients
                                    </h3>
                                    <ul className="space-y-2">
                                        {viewingRecipe.ingredients.map((ingredient) => (
                                            <li
                                                key={ingredient.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Badge variant="secondary" className="text-xs">
                                                    {ingredient.quantityUsed} {ingredient.unit}
                                                </Badge>
                                                <span>{ingredient.name}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Steps */}
                            {viewingRecipe.steps.length > 0 && (
                                <div>
                                    <h3 className="font-semibold mb-3 text-lg">
                                        Instructions
                                    </h3>
                                    <ol className="space-y-4">
                                        {viewingRecipe.steps.map((step, index) => (
                                            <li key={index} className="flex gap-3">
                                                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                                                    {index + 1}
                                                </span>
                                                <p className="flex-1 pt-0.5">{step}</p>
                                            </li>
                                        ))}
                                    </ol>
                                </div>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                onClick={() => setIsViewDialogOpen(false)}
                            >
                                Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </AppLayout>
    )
}
