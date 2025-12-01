import { GoogleGenAI } from "@google/genai";
import { AIAction } from "../types";

const apiKey = process.env.API_KEY || '';

// Safely initialize the client only if the key exists to avoid immediate crash on load if missing
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export const generateWritingAssistance = async (
  text: string,
  action: AIAction,
  context?: string
): Promise<string> => {
  if (!ai) {
    throw new Error("Gemini API Key is missing. Please configure it in your environment.");
  }

  let prompt = "";
  const model = "gemini-2.5-flash"; // Fast and capable for text editing

  switch (action) {
    case 'summarize':
      prompt = `Summarize the following text concisely:\n\n"${text}"`;
      break;
    case 'continue':
      prompt = `Continue writing the following text, maintaining the style and tone. Write about 2-3 sentences:\n\n"${text}"`;
      break;
    case 'fix_grammar':
      prompt = `Correct the grammar and spelling of the following text, but keep the original meaning and tone:\n\n"${text}"`;
      break;
    case 'rephrase':
      prompt = `Rephrase the following text to be more engaging and clear:\n\n"${text}"`;
      break;
  }

  if (context) {
    prompt += `\n\nContext context/background info: ${context}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate content. Please try again.");
  }
};