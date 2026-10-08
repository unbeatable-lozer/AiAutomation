# AI-Powered Web Test Automation Framework with TestRail Integration

A comprehensive test automation framework that combines the latest AI technology with Playwright and TestRail integration for intelligent, self-healing test execution.

## Features

### 🤖 AI-Powered Testing
- **Natural Language Element Finding**: Find elements using plain English descriptions
- **Self-Healing Locators**: Automatically repair broken selectors when UI changes
- **AI Visual Testing**: Screenshot comparison with intelligent difference analysis
- **Smart Test Execution**: Interpret test steps from natural language

### 🔄 TestRail Integration
- **Automatic Test Case Import**: Download test cases directly from TestRail
- **AI-Powered Test Execution**: Execute TestRail test cases using AI interpretation
- **Automatic Result Reporting**: Send test results back to TestRail
- **Test Run Management**: Create, execute, and close test runs automatically

### 🧪 Framework Capabilities
- **Cross-Browser Testing**: Chromium, Firefox, WebKit support
- **TypeScript Support**: Full type safety and IntelliSense
- **Custom Playwright Fixtures**: AI helpers built into test context
- **Comprehensive Reporting**: Detailed logs and screenshots
- **Configuration Management**: Environment-based configuration

## Project Structure

```
src/
├── framework/
│   ├── ai/                 # AI-powered testing modules
│   │   ├── element-finder.ts   # Natural language element detection
│   │   ├── visual-tester.ts    # AI-powered visual testing
│   │   ├── types.ts            # AI type definitions
│   │   └── index.ts            # AI module exports
│   ├── testrail/           # TestRail integration
│   │   ├── client.ts         # TestRail API client
│   │   ├── reporter.ts       # Custom Playwright reporter
│   │   ├── types.ts          # TestRail type definitions
│   │   └── index.ts          # TestRail module exports
│   ├── fixtures.ts         # Custom Playwright test fixtures
│   └── index.ts            # Framework exports
├── scripts/
│   ├── sync-testrail.ts    # Sync local tests to TestRail
│   └── run-testrail-tests.ts # Download & execute TestRail tests with AI
├── tests/                  # Test files
│   ├── example.test.ts     # Basic test examples
│   └── ai-example.test.ts  # AI-powered test examples
└── ...                     # Configuration files
```

## Getting Started

### Prerequisites
- Node.js 16+
- Playwright browsers (`npx playwright install`)
- TestRail account
- An API key for an LLM provider, or a local model server (see [Choosing an LLM provider](#choosing-an-llm-provider))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Install Playwright browsers:
   ```bash
   npx playwright install
   ```

4. Create a `.env` file based on `.env.example`:
   ```env
   # TestRail Configuration
   TESTRAIL_URL=https://yourcompany.testrail.io
   TESTRAIL_USERNAME=your_email@company.com
   TESTRAIL_API_KEY=your_api_key
   TESTRAIL_PROJECT_ID=1
   TESTRAIL_SUITE_ID=1

   # AI Configuration - any OpenAI-compatible provider
   ENABLE_AI=true
   LLM_API_KEY=your_provider_api_key
   # Leave LLM_BASE_URL empty for OpenAI, or point it at a local server:
   # LLM_BASE_URL=http://localhost:11434/v1
   # LLM_MODEL=llama3.1
   ```

### Usage

#### Running Standard Tests
```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

#### Running AI-Powered Tests
```bash
# Enable AI features and run tests
ENABLE_AI=true npm test
```

#### Syncing Tests to TestRail
```bash
# Sync local test files to TestRail
npm run sync:testrail
```

#### Running TestRail Tests with AI
```bash
# Download test cases from TestRail and execute them using AI
ENABLE_AI=true npm run testrail:run
```

## AI Features Explained

### Natural Language Element Finding
Instead of brittle CSS selectors, describe what you want in plain English:

```typescript
// Instead of: await page.click('#login-button')
// Use AI to find the element:
const ai = test.ai; // From custom fixtures
const loginButton = await ai.findElement({ 
  description: 'blue login button', 
  role: 'button' 
});
await loginButton.click();
```

### Self-Healing Locators
When a selector breaks, the AI automatically finds a new one:

```typescript
// This will automatically heal if the selector changes
await test.ai.findAndClick('submit button');
```

### Visual AI Testing
Compare screenshots with intelligent analysis:

```typescript
const visualTester = test.ai.visual;
const result = await visualTester.compareWithBaseline('homepage', {
  threshold: 0.1 // 10% difference threshold
});

if (!result.matched) {
  console.log(`Visual difference detected: ${result.aiAnalysis}`);
}
```

### TestRail AI Test Runner
The framework can download test cases from TestRail and execute them using AI:

```bash
# This will:
# 1. Connect to TestRail
# 2. Download test cases from the specified project/suite
# 3. Create a test run
# 4. Execute each test case using AI to interpret the steps
# 5. Report results back to TestRail
ENABLE_AI=true npm run testrail:run
```

## Configuration

### Environment Variables
| Variable | Description | Required |
|----------|-------------|----------|
| `TESTRAIL_URL` | TestRail instance URL | Yes |
| `TESTRAIL_USERNAME` | TestRail username/email | Yes |
| `TESTRAIL_API_KEY` | TestRail API key | Yes |
| `TESTRAIL_PROJECT_ID` | Project ID in TestRail | Yes |
| `TESTRAIL_SUITE_ID` | Suite ID in TestRail (optional) | No |
| `ENABLE_AI` | Enable AI features (`true`/`false`) | No (defaults to false) |
| `LLM_API_KEY` | API key for the configured LLM provider | Yes if `ENABLE_AI=true` |
| `LLM_BASE_URL` | Base URL of an OpenAI-compatible endpoint | No (defaults to OpenAI) |
| `LLM_MODEL` | Text model name | No (defaults to `gpt-4`) |
| `LLM_VISION_MODEL` | Vision model for screenshot analysis | No (defaults to `gpt-4o`) |
| `OPENAI_API_KEY` | Legacy alias, used when `LLM_API_KEY` is unset | No |

### Choosing an LLM provider

The AI features talk to any OpenAI-compatible endpoint. Only the base URL and
model name change - no code changes, and no extra dependency:

| Provider | `LLM_BASE_URL` | Notes |
|----------|-----------------|-------|
| OpenAI | *(leave empty)* | Default |
| Ollama | `http://localhost:11434/v1` | Local, offline; `LLM_MODEL=llama3.1` |
| LM Studio | `http://localhost:1234/v1` | Local, offline |
| vLLM | `http://localhost:8000/v1` | Self-hosted |
| DeepSeek | `https://api.deepseek.com/v1` | OpenAI-compatible |
| Groq | `https://api.groq.com/openai/v1` | OpenAI-compatible |

For a model that is not OpenAI-compatible at all, implement the `LlmClient`
interface from `src/framework/ai/llm-client.ts` and pass it to
`AIElementFinder` / `AIVisualTester` as the last constructor argument.

Note that page text and screenshots go to whichever provider you configure.
For real test data, prefer a local model server. Vision analysis additionally
requires a multimodal model (`LLM_VISION_MODEL`).

### Playwright Configuration
See `playwright.config.ts` for browser options, timeouts, and test settings.

## Writing Tests

### Basic Test with TestRail Annotation
```typescript
import { test, expect } from '@playwright/test';

test('login functionality', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'secret');
  await page.click('#login-button');
  await expect(page).toHaveURL('/dashboard');
});
```

### AI-Powered Test
```typescript
import { test, expect } from '@playwright/test';

test('AI-powered login', async ({ page }) => {
  await page.goto('/login');
  
  // Use AI to find elements
  const usernameField = await test.ai.findElement({ 
    description: 'username or email field' 
  });
  await usernameField.fill('testuser');
  
  const passwordField = await test.ai.findElement({ 
    description: 'password field' 
  });
  await passwordField.fill('secret');
  
  const loginButton = await test.ai.findElement({ 
    description: 'blue login button', 
    role: 'button' 
  });
  await loginButton.click();
  
  await expect(page).toHaveURL('/dashboard');
});
```

### Test with Visual Validation
```typescript
import { test, expect } from '@playwright/test';

test('dashboard visual validation', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Check visual appearance
  const visualResult = await test.ai.visual.compareWithBaseline('dashboard');
  expect(visualResult.matched).toBeTruthy();
  
  // Or assert specific elements
  await expect(test.ai.locator('welcome message')).toBeVisible();
});
```

## How It Works

### AI Element Finder
1. Tries exact selectors (CSS, XPath)
2. Attempts fuzzy matching (partial text, attributes)
3. Uses the configured LLM to analyze the page and find the element
4. Falls back to semantic selectors (data-testid, aria-label)
5. Caches successful selectors for future use

### AI Visual Tester
1. Captures screenshot of current state
2. Compares with baseline image using pixelmatch
3. Uses AI to analyze differences and provide explanations
4. Provides pass/fail based on configurable threshold

### TestRail Integration
1. Authenticates with TestRail API using credentials
2. Fetches test cases from specified project/suite
3. Creates test run with timestamped name
4. Executes each test case using AI interpretation
5. Reports results (pass/fail) back to TestRail
6. Closes test run and provides URL for viewing results

## Extending the Framework

### Adding Custom AI Features
1. Create new service in `src/framework/ai/`
2. Define types in `src/framework/ai/types.ts`
3. Export from `src/framework/ai/index.ts`
4. Add to fixtures in `src/framework/fixtures.ts`

### Custom TestRail Operations
1. Add methods to `src/framework/testrail/client.ts`
2. Define types in `src/framework/testrail/types.ts`
3. Export from `src/framework/testrail/index.ts`

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Playwright team for excellent browser automation
- TestRail for test management capabilities
- OpenAI for powerful AI models
- All contributors to open source testing tools
