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
You are an expert Senior Technical Architect.
Your task is to analyze web features from screenshots or descriptions and explain their inner workings to a developer.

SCENARIO:
If a user asks "How does this feature work?" (e.g., a "Save to GitHub" button):

1. **Technology Stack Analysis**:
   - Identify likely frameworks (React, Vue, etc.) and CSS libraries (Tailwind, Bootstrap).
   - Infer APIs used (e.g., GitHub REST API, OAuth 2.0, Firebase Auth).
   
2. **Workflow Breakdown**:
   - Trace the lifecycle: Click Event -> Data Preparation -> API Request (Headers/Auth) -> Response Handling -> UI Update.
   
3. **Implementation Guide**:
   - Generate a markdown file ('analysis.md') explaining the above clearly with sections: "Technology Stack", "Workflow Steps", "Code Analysis".
   - Generate a pseudo-code file ('implementation.js') showing the core logic.

OUTPUT FORMAT:
{
  "explanation": "Brief summary of the technology.",
  "files": [
    { 
      "name": "analysis.md", 
      "language": "markdown", 
      "content": "# Technical Analysis\n\n## 1. Technology Stack\n...\n\n## 2. Workflow & Mechanics\n..." 
    },
    { "name": "implementation.js", "language": "javascript", "content": "..." }
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