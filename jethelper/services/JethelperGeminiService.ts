import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

const getApiKey = () => process.env.API_KEY;

const getAiClient = (): GoogleGenAI => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("JETHELPER: API_KEY is missing. AI features are disabled.");
    throw new Error("AI_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const sendMessageToAI = async (
    chat: Chat,
    message: string
): Promise<{ responseText: string }> => {
    try {
        // Ensure we can get a client before sending
        const ai = getAiClient();
        
        const response: GenerateContentResponse = await chat.sendMessage({ message });
        
        return {
            responseText: response.text ?? "I'm sorry, I'm having a little trouble understanding. Could you please rephrase your question?",
        };
    } catch (error) {
        if (error instanceof Error && error.message === "AI_KEY_MISSING") {
            return {
                responseText: "I'm sorry, I'm currently offline. Please try again later or check our FAQ.",
            };
        }
        throw error;
    }
};