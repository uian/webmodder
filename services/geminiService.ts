import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedFile, ModType, AppMode } from "../types";

const GENERATOR_INSTRUCTION = `
You are an expert Senior Frontend Engineer and Browser Extension Developer. 
Your goal is to help users modify the *currently active webpage* by generating Chrome Extensions (Manifest V3), UserScripts (Tampermonkey), or Stylus CSS.

CONTEXT:
You have access to the full HTML source code of the page the user is viewing (provided in the prompt).
Use this source code to identify exact class names, IDs, and DOM structures.

OUTPUT FORMAT:
You must return a JSON object with the following structure:
{
  "explanation": "A brief explanation of how the code works.",
  "files": [
    { "name": "filename.ext", "language": "javascript|json|css", "content": "..." }
  ]
}

RULES:
1. **Analyze the provided HTML context deeply.** Use specific selectors (e.g., '.dashboard-grid .card') found in the source.
2. If the user wants to *modify* the page, provide CSS or JS that can be directly injected.
3. For Chrome Extensions, include 'manifest.json'.
4. For UserScripts, include metadata headers.
5. Make your code robust and production-ready.
`;

const INSPECTOR_INSTRUCTION = `
You are an expert Senior Technical Architect.
Your task is to analyze the *currently active webpage* based on its Source Code and User Request.

CONTEXT:
You have access to the full HTML source code of the page. 
You act as if you are "inside" the browser, reading the live DOM.

SCENARIO:
If a user asks "How does this feature work?", analyze the provided HTML/JS context to explain it.

1. **Technology Stack Analysis**:
   - Identify frameworks (React, Vue, Tailwind, etc.) based on class names (e.g., 'cls-1', 'bg-blue-500') or structure.
   
2. **Workflow & Logic**:
   - Trace how elements interact based on the DOM structure (e.g., forms, buttons with IDs).
   
3. **Implementation Guide**:
   - Generate a markdown analysis.

OUTPUT FORMAT:
{
  "explanation": "Brief summary.",
  "files": [
    { "name": "analysis.md", "language": "markdown", "content": "..." }
  ]
}
`;

export const generateModificationCode = async (
  prompt: string,
  imageBase64: string | undefined,
  pageContext: string | undefined,
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

  // We truncate pageContext if it's massive, but Gemini 2.5 has a huge window so ~50k chars is fine.
  const contextSnippet = pageContext ? pageContext.substring(0, 100000) : "No page context available.";

  const fullPrompt = `
    USER REQUEST: ${prompt}
    CURRENT APP MODE: ${appMode}
    ${!isInspector ? `TARGET OUTPUT TYPE: ${modType}` : ''}
    
    --- START OF ACTIVE BROWSER TAB SOURCE CODE ---
    ${contextSnippet}
    --- END OF SOURCE CODE ---

    ${imageBase64 ? "Note: User also attached a screenshot for visual context." : ""}
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
