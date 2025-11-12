import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAiInstance(): GoogleGenAI {
  // Lazy initialization of the GoogleGenAI instance.
  // This prevents a potential crash on app startup if process.env is not available.
  if (!ai) {
    const API_KEY = process.env.API_KEY;
    if (!API_KEY) {
      // This will be caught by the calling function and displayed to the user.
      throw new Error("API Key for Gemini is not configured.");
    }
    ai = new GoogleGenAI({ apiKey: API_KEY });
  }
  return ai;
}


export interface OcrData {
  numeroRefGasto: string;
  importe: number;
}

export async function extractExpenseDataFromImage(base64Image: string): Promise<OcrData> {
  const gemini = getAiInstance();
  
  const imagePart = {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image,
    },
  };

  try {
    const response: GenerateContentResponse = await gemini.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { 
        parts: [
          imagePart, 
          {
            text: `From the provided image of a receipt, extract the reference number (like 'ALBARAN', 'Nº') and the final total amount (like 'TOTAL'). Return a JSON object with "numeroRefGasto" (string) and "importe" (number). Use a period for decimals. If a value isn't found, use an empty string or 0.
            Example: { "numeroRefGasto": "ALBV24-026039", "importe": 33.53 }`
          }
        ] 
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            numeroRefGasto: {
              type: Type.STRING,
              description: 'El número de referencia de la factura o ticket.',
            },
            importe: {
              type: Type.NUMBER,
              description: 'El importe total de la factura o ticket.',
            },
          },
          required: ['numeroRefGasto', 'importe'],
        },
      },
    });

    const jsonStr = response.text.trim();
    const parsedData = JSON.parse(jsonStr) as OcrData;
    return parsedData;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
}