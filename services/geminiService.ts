import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile, ModType, AppMode } from "../types";

const GENERATOR_INSTRUCTION = `
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

const INSPECTOR_INSTRUCTION = `
You are an expert Senior Frontend Engineer and Technical Architect.
Your goal is to reverse-engineer and explain how specific web features likely work based on visual cues or descriptions provided by the user.

When a user asks about a feature (e.g., "How does the Save to GitHub button work?" or "Analyze this checkout flow"):
1. Analyze the visual context (screenshot) if provided. Identify frameworks (React, Vue, etc.) and UI libraries (Tailwind, Material UI) if recognizable.
2. Explain the likely Technical Implementation. (e.g., "This likely uses the GitHub REST API via OAuth flow...").
3. Break down the Workflow/Process (e.g., "1. User clicks, 2. Event Listener triggers, 3. API Call...").
4. Provide the detailed technical explanation in a markdown file named 'analysis.md'.
5. If helpful, include a 'pseudo_implementation.js' file showing how one might implement this feature.

OUTPUT FORMAT:
{
  "explanation": "A summary of the analysis.",
  "files": [
    { "name": "analysis.md", "language": "markdown", "content": "# Technical Analysis\n\n..." },
    { "name": "pseudo_implementation.js", "language": "javascript", "content": "..." } 
  ]
}
`;

export const generateModificationCode = async (
  prompt: string,
  imageBase64: string | undefined,
  modType: ModType,
  appMode: AppMode
): Promise<{ explanation: string; files: GeneratedFile[] }> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const isInspector = appMode === AppMode.INSPECTOR;
  const systemInstruction = isInspector ? INSPECTOR_INSTRUCTION : GENERATOR_INSTRUCTION;

  const fullPrompt = `
    User Request: ${prompt}
    Current Mode: ${appMode}
    ${!isInspector ? `Target Output Type: ${modType}` : ''}
    
    ${imageBase64 ? "I have attached a screenshot of the webpage/feature." : ""}
  `;

  const parts: any[] = [{ text: fullPrompt }];
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/png",
        data: imageBase64,
      },
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        role: "user",
        parts: parts
      },
      config: {
        systemInstruction: systemInstruction,
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