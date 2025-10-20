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
