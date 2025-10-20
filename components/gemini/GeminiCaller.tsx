// /components/gemini/GeminiCaller.tsx
'use client'

import { useState } from 'react';

export default function GeminiCaller() {
  const [prompt, setPrompt] = useState<string>("Write a short, inspiring quote.");
  const [output, setOutput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const generateQuote = async () => {
    setLoading(true);
    setOutput(''); // Clear previous output
    
    try {
      // 1. Send the request to your secure API Route
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      // 2. Define the expected shape of the API response
      interface ApiResponse {
        output?: string;
        error?: string;
      }

      const data: ApiResponse = await response.json();

      // 3. Handle the response
      if (response.ok && data.output) {
        setOutput(data.output);
      } else {
        setOutput(data.error || 'An unknown error occurred.');
      }
    } catch (error) {
      console.error('Fetch Error:', error);
      setOutput('A network error occurred. Check your console.');
    }
    
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-lg mx-auto bg-gray-50 shadow-lg rounded-xl">
      <h2 className="text-xl font-bold mb-4">Gemini Quote Generator</h2>
      
      <p className="text-gray-700 mb-2">Prompt:</p>
      <p className="text-sm font-mono p-2 bg-white border rounded mb-4">{prompt}</p>

      <button 
        onClick={generateQuote} 
        disabled={loading}
        className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition"
      >
        {loading ? 'Generating...' : 'Generate Quote'}
      </button>

      <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg min-h-20">
        <p className="font-semibold text-gray-800">Generated Output:</p>
        <p className="mt-2 italic text-gray-600">
          {output}
        </p>
      </div>
    </div>
  );
}