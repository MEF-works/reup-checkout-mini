import { GoogleGenAI, Type } from "@google/genai";
import { MerchantProfile } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateMerchantProfile = async (
  businessType: string,
  productType: string
): Promise<MerchantProfile> => {
  if (!apiKey) {
    // Fallback for demo without key
    return {
      storeName: "Nexus Demo Store",
      industry: businessType || "General Retail",
      accentColor: "#6366f1",
      welcomeMessage: "Welcome to the future of decentralized commerce.",
      orderTotal: "$145.00",
      items: [productType || "Demo Item"]
    };
  }

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `Create a fictional, high-end merchant profile for a business type: "${businessType}" selling "${productType}".
    It should sound exclusive and modern.
    Return JSON with:
    - storeName
    - industry
    - accentColor (hex code matching the vibe, e.g., neon or pastel)
    - welcomeMessage (short, punchy, 1 sentence)
    - orderTotal (formatted currency string)
    - items (array of 2 fictional item names in the cart)
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storeName: { type: Type.STRING },
            industry: { type: Type.STRING },
            accentColor: { type: Type.STRING },
            welcomeMessage: { type: Type.STRING },
            orderTotal: { type: Type.STRING },
            items: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["storeName", "industry", "accentColor", "welcomeMessage", "orderTotal", "items"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as MerchantProfile;
    }
    throw new Error("No data returned");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
     return {
      storeName: "Nexus Stealth Store",
      industry: businessType,
      accentColor: "#10b981",
      welcomeMessage: "Secure connection established.",
      orderTotal: "$299.99",
      items: ["Premium Service", "Secure Setup"]
    };
  }
};

export const generateThankYouMessage = async (storeName: string): Promise<string> => {
   if (!apiKey) return "Payment confirmed via selected rail. Order successfully routed.";
   
   try {
     const response = await ai.models.generateContent({
       model: 'gemini-2.5-flash',
       contents: `Write a very short (max 15 words) cool, cyberpunk-style payment confirmation message for a store named ${storeName}. Use neutral demo language - no blockchain or shipment claims.`,
     });
     return response.text || "Payment confirmed via selected rail.";
   } catch (e) {
     return "Payment confirmed via selected rail.";
   }
}