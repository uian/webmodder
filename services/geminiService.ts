import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile, ModType } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert Senior Frontend Engineer and Browser Extension Developer. 
Your goal is to help users modify web pages by generating Chrome Extensions (Manifest V3), UserScripts (Tampermonkey), or Stylus CSS.

When a user provides a screenshot or HTML snippet, analyze it to understand the DOM structure, classes, and IDs.
Then, generate the necessary code to achieve the user's requested modification.

OUTPUT FORMAT:
You must return a JSON object with the following structure:
{
  "explanation": "A brief explanation of how the code works.",
  "files": [
    { "name": "filename.ext", "language": "javascript|json|css", "content": "..." }
  ]
}

RULES:
1. For Chrome Extensions, always include 'manifest.json' (V3) and necessary content scripts/styles.
2. For UserScripts, include the metadata block headers (// ==UserScript== ...).
3. Ensure selector specificity is high enough to override existing styles/scripts.
4. If the user provides an image, use visual analysis to infer likely class names or structure if they are not explicitly visible, but prefer generic robust selectors (e.g., attribute selectors, structural pseudo-classes) if exact IDs are unknown.
5. Code must be production-ready, safe, and clean.
`;

export const generateModificationCode = async (
  prompt: string,
  imageBase64: string | undefined,
  modType: ModType
): Promise<{ explanation: string; files: GeneratedFile[] }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const fullPrompt = `
    User Request: ${prompt}
    Target Output Type: ${modType}
    
    ${imageBase64 ? "I have attached a screenshot of the webpage. Use this to identify elements, colors, and layout structure to target." : ""}
  `;

  const parts: any[] = [{ text: fullPrompt }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png", // Assuming PNG for simplicity, usually safe for base64
        data: imageBase64,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: imageBase64 ? "gemini-2.5-flash" : "gemini-2.5-flash", // Use flash for speed, it handles vision well
      contents: {
        role: "user",
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            files: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  language: { type: Type.STRING, enum: ["javascript", "json", "css", "html", "markdown"] },
                  content: { type: Type.STRING },
                },
                required: ["name", "language", "content"],
              },
            },
          },
          required: ["explanation", "files"],
        },
      },
    });

    if (!response.text) {
      throw new Error("No response from AI");
    }

    const result = JSON.parse(response.text);
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw new Error("Failed to generate code. Please try again.");
  }
};