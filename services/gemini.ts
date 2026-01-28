import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Gunsmith and Historian specializing in firearms, specifically revolvers.
You are embedded in a 3D visualization app.
Your tone should be professional, knowledgeable, and safety-conscious.
When asked about the revolver, assume it is a stylized .357 Magnum standard double-action revolver.
Keep answers concise (under 100 words) unless asked for detail.
Always emphasize firearm safety if the user asks about handling.
`;

export const askGunsmith = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "I'm examining the mechanism... try asking again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The Gunsmith is currently unavailable. Please check your connection.";
  }
};

export const getSafetyTips = async (): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: "List 3 golden rules of gun safety. Return purely as a JSON array of strings.",
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                }
            }
        });
        const text = response.text;
        if (!text) return ["Treat every weapon as if it were loaded."];
        return JSON.parse(text);
    } catch (e) {
        return ["Treat every weapon as if it were loaded.", "Never point at anything you do not intend to destroy.", "Keep finger off trigger until ready to fire."];
    }
}