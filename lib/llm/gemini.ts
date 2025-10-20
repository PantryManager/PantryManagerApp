import { GoogleGenAI } from "@google/genai";

// Ensure the API key is available
if (!process.env.GENAI_API_KEY) {
  throw new Error("GENAI_API_KEY is not set in environment variables.");
}

// Initialize the GoogleGenerativeAI client with the API key
const ai = new GoogleGenAI({});

/**
 * Calls the Google GenAI API to estimate how long a food item will last.
 * @param foodName - The name of the food item.
 * @returns An object containing lifespan estimates for fridge, freezer, and ambient conditions.
 */
export async function getFoodLifespan(foodName: string) {
  const prompt = `
    For the food item "${foodName}", estimate its shelf life under three conditions:
    1. Refrigerated (fridge)
    2. Frozen (freezer)
    3. Room temperature (ambient)

    Return the answer as a JSON object with the keys "fridge", "freezer", and "ambient".
    For example: { "fridge": {"min" : 5, "max": 7, "unit": "days"}, "freezer": {"min": 6, "max": 8, "unit": "months"}, "ambient": {"min": 1, "max": 2, "unit": "days"} }.
    The available units are "days", "weeks", "months", and "years".
  `;

  try {
    // 2. Safely parse the request body with TypeScript typing

    if (!prompt) {
      console.error("Prompt is required");
      return {
        fridge: "Error",
        freezer: "Error",
        ambient: "Error",
      };
    }

    // 3. Call the Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt, // Pass the user prompt
    });

    const text = response.text;

    // Clean the response to extract only the JSON part
    const jsonString = text
      ? text.replace(/```json\n/g, "").replace(/\n```/g, "").trim()
      : "";

    const parsed = JSON.parse(jsonString);

    return {
      fridge: parsed.fridge || "Unknown",
      freezer: parsed.freezer || "Unknown",
      ambient: parsed.ambient || "Unknown",
    };
  } catch (error) {
    console.error("Error calling GenAI:", error);
    // Return a default object or re-throw the error, depending on desired behavior
    return {
      fridge: "Error",
      freezer: "Error",
      ambient: "Error",
    };
  }
}

/**
 * Generates a recipe based on the provided ingredients.
 * @param ingredients - An array of ingredient objects, each containing fcdId, name, quantity, and unit.
 * @returns An object containing the recipe text and a JSON array of used ingredients.
 */
export async function generateRecipe(ingredients: { fcdId: number; name: string; quantity: number; unit: string }[]) {
  const ingredientList = ingredients
    .map((ingredient) => `${ingredient.quantity} ${ingredient.unit} of ${ingredient.name}`)
    .join(", ");

  const prompt = `
    Create a recipe using some or all of the following ingredients: ${ingredientList}.
    The recipe should include a title, a list of steps, and a list of ingredients used.
    Return the result as a JSON object with the keys "title", "steps", and "usedIngredients".
    The "usedIngredients" key should be an array of objects, each containing "fcdId", "name", "quantity", and "unit".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const text = response.text;

    // Clean the response to extract only the JSON part
    const jsonString = text
      ? text.replace(/```json\n/g, "").replace(/\n```/g, "").trim()
      : "";

    const parsed = JSON.parse(jsonString);

    return {
      recipeText: `Title: ${parsed.title}\nSteps:\n${parsed.steps.join("\n")}`,
      usedIngredients: parsed.usedIngredients || [],
    };
  } catch (error) {
    console.error("Error generating recipe:", error);
    return {
      recipeText: "Error generating recipe.",
      usedIngredients: [],
    };
  }
}