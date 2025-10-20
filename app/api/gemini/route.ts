// app/api/generate/route.ts

import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// 1. Initialize the GoogleGenAI client
// The client automatically reads the API key from the GEMINI_API_KEY environment variable.
const ai = new GoogleGenAI({});

// Define the type for the request body
interface GenerateContentRequest {
  prompt: string;
}

export async function POST(request: Request) {
  try {
    // 2. Safely parse the request body with TypeScript typing
    const { prompt } = (await request.json()) as GenerateContentRequest;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // 3. Call the Gemini model
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", 
      contents: prompt, // Pass the user prompt
    });

    const responseText = response.text;

    // 4. Return the generated text as a JSON response
    return NextResponse.json({ output: responseText });

  } catch (error) {
    console.error("Gemini API Error:", error);
    // Return a generic error to the client
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

// How to integrate:
// // app/page.tsx
// import GeminiCaller from './components/GeminiCaller';

// export default function Home() {
//   return (
//     <main className="flex min-h-screen flex-col items-center justify-center p-24">
//       <GeminiCaller />
//     </main>
//   );
// }