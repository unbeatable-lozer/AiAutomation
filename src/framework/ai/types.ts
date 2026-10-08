/**
 * AI Types and Interfaces
 * 
 * Defines the types for AI-powered testing features including:
 * - Element detection and self-healing
 * - Visual testing
 * - Natural language processing
 */

import { Locator, Page } from '@playwright/test';

/**
 * Element description for AI-based element detection
 */
export interface AIElementDescription {
  /** Natural language description of the element */
  description: string;
  /** Additional context about the element */
  context?: string;
  /** Expected element role (button, input, link, etc.) */
  role?: string;
  /** Parent element context */
  parent?: string;
}

/**
 * Result of AI element finder
 */
export interface AIElementResult {
  /** Whether the element was found */
  found: boolean;
  /** The Playwright locator */
  locator?: Locator;
  /** Description of how the element was found */
  method: 'exact' | 'fuzzy' | 'ai' | 'fallback';
  /** Confidence score (0-1) */
  confidence: number;
  /** Alternative locators tried */
  alternatives?: string[];
  /** Error message if not found */
  error?: string;
}

/**
 * Visual comparison result
 */
export interface VisualComparisonResult {
  /** Whether images match */
  matched: boolean;
  /** Difference percentage (0-100) */
  diffPercentage: number;
  /** Path to difference image */
  diffImagePath?: string;
  /** AI analysis of the differences */
  aiAnalysis?: string;
  /** Raw pixel difference count */
  pixelDiff?: number;
  /** Error message if comparison failed */
  error?: string;
}

/**
 * AI test generation prompt
 */
export interface AITestPrompt {
  /** Feature description */
  feature: string;
  /** User story or requirement */
  userStory?: string;
  /** Acceptance criteria */
  acceptanceCriteria?: string[];
  /** Existing test context */
  existingTests?: string[];
}

/**
 * Generated test step
 */
export interface GeneratedTestStep {
  /** Step description */
  description: string;
  /** Action to perform */
  action: 'click' | 'fill' | 'select' | 'assert' | 'hover' | 'scroll' | 'wait';
  /** Target element or selector */
  target?: string;
  /** Value to input or assert */
  value?: string;
  /** Timeout for this step */
  timeout?: number;
}

/**
 * Self-healing locator result
 */
export interface SelfHealingResult {
  /** Original locator that failed */
  originalLocator: string;
  /** New locator that works */
  newLocator: string;
  /** How the new locator was derived */
  healingMethod: 'text' | 'structure' | 'visual' | 'semantic' | 'xpath';
  /** Confidence in the new locator */
  confidence: number;
  /** Whether this was a permanent fix */
  permanent: boolean;
}

/**
 * Page analysis result from AI
 */
export interface PageAnalysis {
  /** Page title */
  title: string;
  /** Main content areas */
  contentAreas: string[];
  /** Interactive elements */
  interactiveElements: string[];
  /** Navigation elements */
  navigationElements: string[];
  /** Form fields */
  formFields: string[];
  /** Potential test targets */
  testTargets: string[];
}

/**
 * AI Configuration
 *
 * Provider-agnostic: any OpenAI-compatible endpoint can back the AI features.
 * Environment resolution lives in ./config.ts.
 */
export interface AIConfig {
  /** Enable AI features */
  enabled: boolean;
  /** API key for the configured provider */
  apiKey: string;
  /**
   * Base URL of an OpenAI-compatible endpoint.
   * Leave undefined to use the OpenAI default (https://api.openai.com/v1).
   */
  baseUrl?: string;
  /** Text model name (provider specific) */
  model: string;
  /** Vision model used for screenshot analysis, defaults to `model` */
  visionModel?: string;
  /** Extra headers required by the provider (for example Azure api-version) */
  headers?: Record<string, string>;
  /** Temperature for generation */
  temperature: number;
  /** Maximum retries for element finding */
  maxRetries: number;
  /** Enable self-healing */
  enableSelfHealing: boolean;
  /** Enable visual testing */
  enableVisualTesting: boolean;
  /** Screenshot threshold for visual testing */
  visualThreshold: number;
}
