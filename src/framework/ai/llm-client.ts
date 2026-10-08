/**
 * Provider-Agnostic LLM Client
 *
 * All AI features talk to an LLM through this single seam, so the framework is
 * not tied to OpenAI. Any OpenAI-compatible endpoint works:
 *
 *   OpenAI       (default, no LLM_BASE_URL)
 *   Ollama       LLM_BASE_URL=http://localhost:11434/v1
 *   LM Studio    LLM_BASE_URL=http://localhost:1234/v1
 *   vLLM         LLM_BASE_URL=http://localhost:8000/v1
 *   DeepSeek     LLM_BASE_URL=https://api.deepseek.com/v1
 *   Groq         LLM_BASE_URL=https://api.groq.com/openai/v1
 *
 * The OpenAI SDK is only used as an HTTP client for that protocol, so no
 * additional dependency is required for non-OpenAI providers.
 */

import OpenAI from 'openai';
import { AIConfig } from './types';

/** A chat message sent to the model */
export interface LlmMessage {
  role: 'system' | 'user';
  content: string;
}

/** Per-call generation options */
export interface LlmCompletionOptions {
  /** Sampling temperature, defaults to AIConfig.temperature */
  temperature?: number;
  /** Maximum tokens to generate */
  maxTokens?: number;
}

/**
 * Minimal LLM contract used by the AI testing features.
 * Implement it to plug in a non-OpenAI-compatible provider.
 */
export interface LlmClient {
  /** Send a text-only completion and return the response text */
  complete(messages: LlmMessage[], options?: LlmCompletionOptions): Promise<string | null>;

  /** Send a prompt together with base64-encoded PNG images and return the response text */
  completeWithImages(prompt: string, imagesBase64: string[], options?: LlmCompletionOptions): Promise<string | null>;
}

/**
 * Create a client for the configured provider.
 * Returns null when AI is disabled or no API key is configured, in which case
 * the AI features fall back to their non-AI behavior.
 */
export function createLlmClient(config: AIConfig): LlmClient | null {
  if (!config.enabled) {
    return null;
  }

  if (!config.apiKey) {
    console.warn(
      'AI features are enabled (ENABLE_AI=true) but no API key is configured. ' +
        'Set LLM_API_KEY (or OPENAI_API_KEY for the default OpenAI endpoint); ' +
        'falling back to non-AI behavior.'
    );
    return null;
  }

  const sdk = new OpenAI({
    apiKey: config.apiKey,
    // Undefined keeps the SDK default (https://api.openai.com/v1)
    baseURL: config.baseUrl,
    defaultHeaders: config.headers,
    maxRetries: config.maxRetries
  });

  return {
    async complete(messages, options) {
      const response = await sdk.chat.completions.create({
        model: config.model,
        messages: messages.map((message) => ({ role: message.role, content: message.content })),
        temperature: options?.temperature ?? config.temperature,
        max_tokens: options?.maxTokens
      });

      return response.choices[0]?.message?.content?.trim() || null;
    },

    async completeWithImages(prompt, imagesBase64, options) {
      const response = await sdk.chat.completions.create({
        model: config.visionModel || config.model,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imagesBase64.map((image) => ({
                type: 'image_url' as const,
                image_url: { url: `data:image/png;base64,${image}` }
              }))
            ]
          }
        ],
        temperature: options?.temperature ?? config.temperature,
        max_tokens: options?.maxTokens ?? 500
      });

      return response.choices[0]?.message?.content?.trim() || null;
    }
  };
}
