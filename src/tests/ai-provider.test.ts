/**
 * Provider-agnostic LLM layer
 *
 * These tests run fully offline: no API key and no network access. They prove
 * that the AI features are driven through the LlmClient seam, that the
 * environment contract selects the provider, and that a custom client can be
 * injected for a non-OpenAI-compatible provider.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';
import * as os from 'os';
import * as path from 'path';
import { resolveAiConfig } from '../framework/ai/config';
import { createLlmClient, LlmClient, LlmMessage } from '../framework/ai/llm-client';
import { AIElementFinder } from '../framework/ai/element-finder';
import { AIVisualTester } from '../framework/ai/visual-tester';

/** Minimal Page stand-in: only element counts matter for these tests */
function stubPage(counts: Record<string, number>): Page {
  return {
    locator: (selector: string) => ({ count: async () => counts[selector] ?? 0 }),
    content: async () => '<html><body>stub</body></html>',
    evaluate: async () => 'stub page text'
  } as unknown as Page;
}

test('resolveAiConfig reads the provider-agnostic environment contract', () => {
  const config = resolveAiConfig({
    ENABLE_AI: 'true',
    LLM_API_KEY: 'key-from-llm',
    LLM_BASE_URL: 'http://localhost:11434/v1',
    LLM_MODEL: 'llama3.1',
    LLM_VISION_MODEL: 'llava',
    OPENAI_API_KEY: 'key-from-openai'
  } as NodeJS.ProcessEnv);

  expect(config.enabled).toBe(true);
  expect(config.apiKey).toBe('key-from-llm');
  expect(config.baseUrl).toBe('http://localhost:11434/v1');
  expect(config.model).toBe('llama3.1');
  expect(config.visionModel).toBe('llava');
});

test('resolveAiConfig falls back to OPENAI_API_KEY and the OpenAI endpoint', () => {
  const config = resolveAiConfig({
    ENABLE_AI: 'true',
    OPENAI_API_KEY: 'legacy-key'
  } as NodeJS.ProcessEnv);

  expect(config.apiKey).toBe('legacy-key');
  expect(config.baseUrl).toBeUndefined();
  expect(config.enabled).toBe(true);
});

test('no client is created when AI is disabled or no key is set', () => {
  expect(createLlmClient(resolveAiConfig({} as NodeJS.ProcessEnv))).toBeNull();
  expect(createLlmClient(resolveAiConfig({ ENABLE_AI: 'true' } as NodeJS.ProcessEnv))).toBeNull();
});

test('a client is created for any OpenAI-compatible base URL (no network)', () => {
  const client = createLlmClient(
    resolveAiConfig({
      ENABLE_AI: 'true',
      LLM_API_KEY: 'ollama',
      LLM_BASE_URL: 'http://localhost:11434/v1',
      LLM_MODEL: 'llama3.1'
    } as NodeJS.ProcessEnv)
  );

  expect(client).not.toBeNull();
  expect(typeof client!.complete).toBe('function');
  expect(typeof client!.completeWithImages).toBe('function');
});

test('the element finder routes AI lookups through the injected client', async () => {
  const prompts: LlmMessage[][] = [];
  const llm: LlmClient = {
    complete: async (messages) => {
      prompts.push(messages);
      return '#go';
    },
    completeWithImages: async () => null
  };

  const finder = new AIElementFinder(stubPage({ '#go': 1 }), { enabled: true, apiKey: 'injected' }, llm);
  const result = await finder.findElement({ description: 'sign in button', role: 'button' });

  expect(result.found).toBe(true);
  expect(result.method).toBe('ai');
  expect(result.locator).toBeDefined();
  expect(prompts).toHaveLength(1);
  expect(prompts[0][0].content).toContain('sign in button');
});

test('the element finder degrades to non-AI lookup without a provider', async () => {
  const finder = new AIElementFinder(stubPage({}), { enabled: true, apiKey: '' }, null);
  const result = await finder.findElement({ description: 'sign in button' });

  expect(result.found).toBe(false);
  expect(result.method).toBe('fallback');
  expect(await finder.healLocator('#old')).toBeNull();
  expect(await finder.analyzePage()).toBeNull();
});

test('visual analysis is skipped without a provider', async () => {
  process.env.SCREENSHOT_DIR = path.join(os.tmpdir(), 'ai-visual-test-baselines');

  const tester = new AIVisualTester(
    {} as Page,
    {} as BrowserContext,
    { enabled: false, apiKey: '' },
    null
  );

  expect(await tester.analyzeDifferences(Buffer.from('a'), Buffer.from('b'))).toBeNull();
});

test('visual analysis uses the injected client for screenshot comparison', async () => {
  process.env.SCREENSHOT_DIR = path.join(os.tmpdir(), 'ai-visual-test-baselines');

  const images: number[] = [];
  const llm: LlmClient = {
    complete: async () => null,
    completeWithImages: async (_prompt, base64Images) => {
      images.push(base64Images.length);
      return 'Layout shifted by 4px';
    }
  };

  const tester = new AIVisualTester({} as Page, {} as BrowserContext, { enabled: true, apiKey: 'injected' }, llm);
  const analysis = await tester.analyzeDifferences(Buffer.from('current'), Buffer.from('baseline'));

  expect(analysis).toBe('Layout shifted by 4px');
  expect(images).toEqual([2]);
});
