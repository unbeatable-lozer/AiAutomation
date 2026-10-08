/**
 * AI Configuration Resolution
 *
 * Single place where the provider-agnostic environment contract is read, so
 * the rest of the framework never touches process.env directly.
 *
 *   ENABLE_AI=true                 enable the AI features
 *   LLM_API_KEY=...                key for the configured provider
 *   LLM_BASE_URL=...               OpenAI-compatible endpoint (unset = OpenAI)
 *   LLM_MODEL=...                  text model
 *   LLM_VISION_MODEL=...           vision model used by visual testing
 *   OPENAI_API_KEY=...             legacy fallback for LLM_API_KEY
 */

import { AIConfig } from './types';

/**
 * Build the AI configuration from environment variables.
 * Exported with an injectable env object so it can be tested without mutating process.env.
 */
export function resolveAiConfig(env: NodeJS.ProcessEnv = process.env): AIConfig {
  return {
    enabled: env.ENABLE_AI === 'true',
    apiKey: env.LLM_API_KEY || env.OPENAI_API_KEY || '',
    baseUrl: env.LLM_BASE_URL || undefined,
    model: env.LLM_MODEL || 'gpt-4',
    visionModel: env.LLM_VISION_MODEL || 'gpt-4o',
    temperature: 0.7,
    maxRetries: 3,
    enableSelfHealing: true,
    enableVisualTesting: true,
    visualThreshold: 0.1
  };
}

/**
 * AI configuration snapshot taken at module load.
 * Prefer resolveAiConfig() inside long-lived code so later environment
 * changes (dotenv, CI variables) are picked up.
 */
export const DEFAULT_AI_CONFIG: AIConfig = resolveAiConfig();
