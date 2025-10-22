import { gemini } from '@/lib/llm'

/**
 * Calls the Google GenAI API to estimate how long a food item will last.
 * @param foodName - The name of the food item.
 * @returns An object containing lifespan estimates for fridge, freezer, and ambient conditions.
 */
export async function getFoodLifespan(foodName: string): Promise<FoodLifespan | null> {
    const prompt = `
    For the food item "${foodName}", estimate its shelf life under under the most common storage condition out of the following three:
    1. Refrigerated (fridge)
    2. Frozen (freezer)
    3. Room temperature (ambient)

    Return the answer as a JSON object with the keys: 
    {
      "type": "FRIDGE" or "FREEZER" or "AMBIENT",
      "duration": 50
    }
    The duration is always in days.
    For example: { "type": "FRIDGE", "duration": 7 }

    If you are unsure about the shelf life, provide your best estimate.

    Provide only the JSON object in your response, without any additional text.
  `

    try {
        // 3. Call the Gemini model
        const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt, // Pass the user prompt
        })

        const text = response.text
        console.log(text)

        const jsonString = text
            ? text
                  .replace(/```json\n/g, '')
                  .replace(/\n```/g, '')
                  .trim()
            : ''

        const parsed = JSON.parse(jsonString)

        return {
            type: parsed.type as StorageType,
            duration: parseInt(parsed.duration),
        }
    } catch (error) {
        console.error('Error calling GenAI:', error)
        return null
    }
}

/**
 * Generates a recipe based on the provided ingredients.
 * @param ingredients - An array of ingredient objects, each containing userFoodItemId, fdcId, name, quantity, and unit.
 * @returns A GeneratedRecipe object with title, steps, and usedIngredients.
 */
export async function generateRecipe(
    ingredients: {
        userFoodItemId: string
        fdcId: number
        name: string
        quantity: number
        unit: string
    }[]
): Promise<{
    title: string
    description?: string
    servings?: number
    prepTime?: string
    cookTime?: string
    steps: string[]
    usedIngredients: {
        userFoodItemId: string
        fdcId: number
        name: string
        quantityUsed: number
        unit: string
    }[]
}> {
    const ingredientList = ingredients
        .map(
            (ingredient) =>
                `${ingredient.quantity} ${ingredient.unit} of ${ingredient.name} (ID: ${ingredient.userFoodItemId})`
        )
        .join(', ')

    const prompt = `
    Create a delicious recipe using some or all of the following ingredients: ${ingredientList}.
    Staples like salt, pepper and oil can be assumed to be available.

    IMPORTANT: The ingredients are listed in priority order, with items expiring soonest listed first.
    Try to use as many of the early ingredients as possible.

    Return the result as a JSON object with the following structure:
    {
      "title": "Recipe Name",
      "description": "Brief description of the dish",
      "servings": 4,
      "prepTime": "15 minutes",
      "cookTime": "30 minutes",
      "steps": ["Step 1", "Step 2", ...],
      "usedIngredients": [
        {
          "userFoodItemId": "the exact ID from the ingredient list",
          "fdcId": 123456,
          "name": "ingredient name",
          "quantityUsed": 2.5,
          "unit": "cups"
        }
      ]
    }

    Make sure to include the EXACT userFoodItemId from the ingredient list for each used ingredient.
    Only include ingredients you actually use in the recipe.
    Provide only the JSON object in your response, without any additional text.
  `

    try {
        const response = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        })

        const text = response.text

        const jsonString = text
            ? text
                  .replace(/```json\n/g, '')
                  .replace(/\n```/g, '')
                  .trim()
            : ''

        const parsed = JSON.parse(jsonString)

        return {
            title: parsed.title || 'Untitled Recipe',
            description: parsed.description,
            servings: parsed.servings,
            prepTime: parsed.prepTime,
            cookTime: parsed.cookTime,
            steps: Array.isArray(parsed.steps) ? parsed.steps : [],
            usedIngredients: Array.isArray(parsed.usedIngredients)
                ? parsed.usedIngredients
                : [],
        }
    } catch (error) {
        console.error('Error generating recipe:', error)
        throw new Error('Failed to generate recipe')
    }
}
