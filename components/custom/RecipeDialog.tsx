'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { GeneratedRecipe } from '@/types/api'
import { Clock, Users, ChefHat } from 'lucide-react'

interface RecipeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    recipe: GeneratedRecipe | null
    loading?: boolean
    onAcceptRecipe?: (recipe: GeneratedRecipe) => void
}

export function RecipeDialog({
    open,
    onOpenChange,
    recipe,
    loading = false,
    onAcceptRecipe,
}: RecipeDialogProps) {
    if (loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Generating Recipe...</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!recipe) {
        return null
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl">{recipe.title}</DialogTitle>
                    {recipe.description && (
                        <p className="text-muted-foreground mt-2">
                            {recipe.description}
                        </p>
                    )}
                </DialogHeader>

                <div className="space-y-6">
                    {/* Recipe Metadata */}
                    {(recipe.servings || recipe.prepTime || recipe.cookTime) && (
                        <div className="flex flex-wrap gap-4">
                            {recipe.servings && (
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        {recipe.servings} servings
                                    </span>
                                </div>
                            )}
                            {recipe.prepTime && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        Prep: {recipe.prepTime}
                                    </span>
                                </div>
                            )}
                            {recipe.cookTime && (
                                <div className="flex items-center gap-2">
                                    <ChefHat className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">
                                        Cook: {recipe.cookTime}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Used Ingredients */}
                    {recipe.usedIngredients.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-3 text-lg">
                                Ingredients Used
                            </h3>
                            <ul className="space-y-2">
                                {recipe.usedIngredients.map((ingredient, index) => (
                                    <li
                                        key={ingredient.userFoodItemId || index}
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
                    {recipe.steps.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-3 text-lg">
                                Instructions
                            </h3>
                            <ol className="space-y-4">
                                {recipe.steps.map((step, index) => (
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

                <DialogFooter className="flex-row gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Close
                    </Button>
                    {onAcceptRecipe && (
                        <Button
                            type="button"
                            onClick={() => {
                                onAcceptRecipe(recipe)
                                onOpenChange(false)
                            }}
                            disabled
                            title="Coming soon: Accept recipe and update pantry"
                        >
                            Accept Recipe (Coming Soon)
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
