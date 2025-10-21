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
 * @param ingredients - An array of ingredient objects, each containing fcdId, name, quantity, and unit.
 * @returns An object containing the recipe text and a JSON array of used ingredients.
 */
export async function generateRecipe(
    ingredients: {
        fcdId: number
        name: string
        quantity: number
        unit: string
    }[]
) {
    const ingredientList = ingredients
        .map(
            (ingredient) =>
                `${ingredient.quantity} ${ingredient.unit} of ${ingredient.name}`
        )
        .join(', ')

    const prompt = `
    Create a recipe using some or all of the following ingredients: ${ingredientList}.
    The recipe should include a title, a list of steps, and a list of ingredients used.
    Return the result as a JSON object with the keys "title", "steps", and "usedIngredients".
    The "usedIngredients" key should be an array of objects, each containing "fcdId", "name", "quantity", and "unit".
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
            recipeText: `Title: ${parsed.title}\nSteps:\n${parsed.steps.join('\n')}`,
            usedIngredients: parsed.usedIngredients || [],
        }
    } catch (error) {
        console.error('Error generating recipe:', error)
        return {
            recipeText: 'Error generating recipe.',
            usedIngredients: [],
        }
    }
}
