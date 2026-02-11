import { logger } from "./logger";
import OpenAI from "openai";
import "dotenv/config";

export const llm = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
export const MODEL = process.env.AGENT_MODEL ?? "gpt-5-thinking"; // configurable
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export async function createChatCompletion(
  messages: ChatMessage[],
  functions?: any[],
  temperature: number = 0.7
) {
  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      messages,
      functions,
      function_call: functions ? "auto" : undefined,
      temperature,
      max_tokens: 1500,
    });

    return response;
  } catch (error) {
    logger.error("OpenAI API error:", error);
    throw new Error("Failed to generate response from OpenAI");
  }
}
