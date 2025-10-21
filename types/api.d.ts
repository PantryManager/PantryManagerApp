// Shared API Types
// These types are used by both client components and API routes

// ============================================
// Common Types
// ============================================

export interface ApiError {
    error: string
}

export interface SuccessResponse {
    success: boolean
}

// ============================================
// Entity Types
// ============================================

export interface Unit {
    id: string
    shortName: string
    displayName: string
}

export interface FoodItem {
    id: string
    name: string
    category: string
    fdcId: number | null
}

export interface PantryItem {
    id: string
    quantity: number
    purchaseDate: string
    estimatedExpirationDate: string | null
    foodItem: FoodItem
    unit: Unit
}

// ============================================
// Food Search (FDC API)
// ============================================

export interface FDCSearchResult {
    fdcId: number
    name: string
    category: string
    dataType: string
    brandOwner?: string
}

export interface FoodSearchResponse {
    results: FDCSearchResult[]
    totalHits?: number
}

// ============================================
// Request Types
// ============================================

export interface CreatePantryItemRequest {
    fdcId: number
    foodName: string
    foodCategory: string
    unitId: string
    quantity: number
    purchaseDate: string
}

export interface UpdatePantryItemRequest {
    foodItemId?: string
    unitId?: string
    quantity?: number
    purchaseDate?: string
    estimatedExpirationDate?: string | null
}

// ============================================
// Recipe Generation Types
// ============================================

export interface RecipeIngredient {
    userFoodItemId: string // Reference to the pantry item
    fdcId: number
    name: string
    quantity: number
    unit: string
}

export interface UsedIngredient {
    userFoodItemId: string // Reference to the pantry item
    fdcId: number
    name: string
    quantityUsed: number
    unit: string
}

export interface GeneratedRecipe {
    title: string
    description?: string
    servings?: number
    prepTime?: string
    cookTime?: string
    steps: string[]
    usedIngredients: UsedIngredient[]
}

export interface GenerateRecipeRequest {
    ingredients: RecipeIngredient[]
}

export interface GenerateRecipeResponse {
    recipe: GeneratedRecipe
}

// Future: Accept recipe and update pantry
export interface AcceptRecipeRequest {
    recipe: GeneratedRecipe
}
