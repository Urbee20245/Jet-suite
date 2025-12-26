
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

export const sendMessageToAI = async (
    chat: Chat,
    message: string
): Promise<{ responseText: string }> => {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    
    return {
        responseText: response.text ?? "I'm sorry, I'm having a little trouble understanding. Could you please rephrase your question?",
    };
};
