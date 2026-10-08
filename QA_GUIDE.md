# QA Engineer's Guide to AI-Powered Testing

This guide provides detailed instructions for QA engineers on how to effectively use the AI-powered features in the test automation framework.

## Table of Contents
1. [Getting Started](#getting-started)
2. [AI-Powered Element Finding](#ai-powered-element-finding)
3. [Visual AI Testing](#visual-ai-testing)
4. [AI Page Analysis](#ai-page-analysis)
5. [Self-Healing Locators](#self-healing-locators)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Examples](#examples)

## Getting Started

### Enabling AI Features

To use AI-powered testing features, you need to:

1. Set up your LLM provider in the `.env` file:
   ```env
   LLM_API_KEY=your-api-key-here
   ENABLE_AI=true
   # Optional: point at any OpenAI-compatible endpoint, e.g. a local Ollama server
   # LLM_BASE_URL=http://localhost:11434/v1
   # LLM_MODEL=llama3.1
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Verify the setup:
   ```bash
   npm run test:ai
   ```

### Available AI Fixtures

When AI is enabled, your tests receive an `ai` fixture with these methods:

- `findElement(description, options?)` - Find elements using natural language
- `compareScreenshot(name, options?)` - Compare screenshots with baseline
- `analyzePage()` - Get AI analysis of page structure
- `healLocator(locator)` - Attempt to heal broken locators

## AI-Powered Element Finding

### How It Works

The AI element finder uses the configured LLM provider to interpret natural language descriptions and convert them to CSS selectors or XPath expressions. It employs multiple strategies:

1. **Exact Matching**: Tries to find elements using precise selectors based on the description
2. **Fuzzy Matching**: Uses partial text matching and contextual clues
3. **AI Interpretation**: Sends the description and page content to the configured LLM provider for interpretation
4. **Fallback**: Uses semantic HTML attributes as a last resort

### Usage Examples

#### Basic Element Finding

```typescript
import { test, expect } from './framework';

test.ai('can find login elements', async ({ page, ai }) => {
  await page.goto('/login');
  
  // Find by placeholder text
  const emailInput = await ai.findElement('email input field');
  await emailInput.fill('user@example.com');
  
  // Find by label text
  const passwordInput = await ai.findElement('password input field');
  await passwordInput.fill('securepassword');
  
  // Find by button text
  const loginButton = await ai.findElement('sign in button');
  await loginButton.click();
});
```

#### With Context and Role

```typescript
test.ai('can find elements with context', async ({ page, ai }) => {
  await page.goto('/profile');
  
  // Find within a specific context
  const saveButton = await ai.findElement('save button', {
    context: 'profile form',
    role: 'button'
  });
  await saveButton.click();
  
  // Find by role only
  const searchField = await ai.findElement('search field', {
    role: 'textbox'
  });
  await searchField.fill('test query');
});
```

#### Handling Multiple Matches

```typescript
test.ai('handles multiple similar elements', async ({ page, ai }) => {
  await page.goto('/dashboard');
  
  // Get all matching elements
  const buttons = await ai.findElement('action button');
  
  // The AI will return the most confident match
  // You can also work with arrays if needed
  const firstButton = buttons.first();
  await firstButton.click();
});
```

### Tips for Effective Descriptions

1. **Be Specific**: Include visual attributes when possible
   - ❌ "button" 
   - ✅ "blue submit button"
   - ✅ "large green button with white text"

2. **Include Context**: Describe where the element is located
   - ❌ "input field"
   - ✅ "email input field in the login form"
   - ✅ "search box in the website header"

3. **Use Action Language**: Describe what the element does
   - ❌ "link"
   - ✅ "link to reset password"
   - ✅ "button that saves the form"

4. **Mention Visual Cues**: Colors, icons, positioning
   - ❌ "error message"
   - ✅ "red error message below the email field"
   - ✅ "warning icon next to the password field"

## Visual AI Testing

### How It Works

The visual testing feature:

1. Captures screenshots of the current page or specific elements
2. Compares them with baseline screenshots using pixel-by-pixel comparison
3. Uses AI to analyze significant differences and provide explanations
4. Reports the percentage difference and whether it exceeds the threshold

### Usage Examples

#### Basic Visual Comparison

```typescript
import { test, expect } from './framework';

test.ai('dashboard visual regression test', async ({ page, ai }) => {
  await page.goto('/dashboard');
  
  // Compare with baseline (threshold of 5% difference)
  const result = await ai.compareScreenshot('dashboard-view', {
    threshold: 0.05
  });
  
  expect(result.matched).toBe(true, `Images differ by ${result.diffPercentage}%`);
  
  // Log AI analysis if available
  if (result.aiAnalysis) {
    console.log('AI Analysis:', result.aiAnalysis);
  }
});
```

#### Element-Specific Visual Testing

```typescript
test.ai('visual test of specific component', async ({ page, ai }) => {
  await page.goto('/product-page');
  
  // Test just the product image component
  const result = await ai.compareScreenshot('product-image', {
    selector: '.product-image-container',
    threshold: 0.02 // Stricter threshold for images
  });
  
  expect(result.matched).toBe(true);
});
```

#### Updating Baselines

```typescript
test.ai('update baseline for intentional changes', async ({ page, ai }) => {
  await page.goto('/new-feature-page');
  
  // When you've intentionally changed the UI and want to update the baseline
  const result = await ai.compareScreenshot('new-feature-view', {
    updateBaseline: true
  });
  
  // This will always pass and update the baseline
  expect(result.matched).toBe(true);
});
```

### Best Practices for Visual Testing

1. **Consistent Viewport**: Always set the same viewport size
   ```typescript
   await page.setViewportSize({ width: 1280, height: 720 });
   ```

2. **Stable Content**: Avoid testing elements with dynamic content (timestamps, counters)
   - Use `waitForSelector` to wait for stable states
   - Consider mocking APIs that return changing data

3. **Appropriate Thresholds**:
   - Layout tests: 0.01-0.05 (1-5%)
   - Content tests: 0.05-0.10 (5-10%)
   - Image-heavy pages: May need higher thresholds

4. **Baseline Management**:
   - Store baselines in version control for critical screens
   - Update baselines intentionally when UI changes are approved
   - Review visual diffs regularly to catch unintended changes

## AI Page Analysis

### How It Works

The AI page analysis feature:

1. Captures the visible text content and structure of the page
2. Sends this information to the configured LLM provider with a prompt to analyze the page
3. Returns structured information about:
   - Page title and purpose
   - Main content areas
   - Interactive elements (buttons, links, forms)
   - Navigation elements
   - Form fields and their purposes
   - Potential test targets

### Usage Examples

#### Basic Page Analysis

```typescript
import { test } from './framework';

test.ai('analyze login page for test planning', async ({ page, ai }) => {
  await page.goto('/login');
  
  const analysis = await ai.analyzePage();
  
  console.log('=== PAGE ANALYSIS ===');
  console.log('Title:', analysis.title);
  console.log('Purpose:', analysis.purpose || 'Not specified');
  console.log('\\nMain Content Areas:');
  analysis.contentAreas.forEach((area, i) => {
    console.log(`  ${i+1}. ${area}`);
  });
  
  console.log('\\nInteractive Elements:');
  analysis.interactiveElements.forEach((element, i) => {
    console.log(`  ${i+1}. ${element}`);
  });
  
  console.log('\\nForm Fields:');
  analysis.formFields.forEach((field, i) => {
    console.log(`  ${i+1}. ${field}`);
  });
  
  // Use this information to plan your tests
  if (analysis.formFields.length > 0) {
    // We know we need to test form validation
    test.todo('Test form validation on login page');
  }
});
```

#### Using Analysis to Generate Tests

```typescript
test.ai('generate tests from page analysis', async ({ page, ai }) => {
  await page.goto('/settings');
  
  const analysis = await ai.analyzePage();
  
  // Generate test ideas based on analysis
  const testIdeas = [];
  
  // Test each form field
  analysis.formFields.forEach(field => {
    testIdeas.push(`Validate ${field} with invalid input`);
    testIdeas.push(`Test ${field} with valid input`);
  });
  
  // Test each interactive element
  analysis.interactiveElements.forEach(element => {
    testIdeas.push(`Click ${element} and verify action`);
  });
  
  // Log the generated test ideas
  console.log('Generated test ideas:');
  testIdeas.forEach((idea, i) => {
    console.log(`  ${i+1}. ${idea}`);
  });
  
  // You could even dynamically create tests here
  // (advanced usage - typically you'd write the tests manually based on insights)
});
```

### Interpreting Analysis Results

The analysis returns an object with these properties:

- `title`: The page title from `<title>` tag
- `purpose`: AI-generated description of what the page is for
- `contentAreas`: Main sections of the page (header, main, sidebar, etc.)
- `interactiveElements`: Buttons, links, and other clickable elements
- `navigationElements`: Menus, breadcrumbs, pagination controls
- `formFields`: Input fields, selects, textareas with their purposes
- `testTargets`: Suggested elements that are good candidates for testing

## Self-Healing Locators

### How It Works

The self-healing feature:

1. When a traditional locator fails to find an element
2. Captures the current state of the page
3. Uses AI to interpret what the original locator was trying to find
4. Generates alternative locators based on the element's:
   - Text content
   - Visual appearance
   - DOM structure
   - Semantic meaning
   - Accessibility attributes
5. Returns the most likely correct locator

### Usage Examples

#### Basic Self-Healing

```typescript
import { test, expect } from './framework';

test.ai('test with self-healing locator', async ({ page, ai }) => {
  await page.goto('/user-profile');
  
  // This locator might break if the DOM structure changes
  const fragileLocator = 'div#profile-section > div > div > input[name="email"]';
  
  // Try to heal the locator if it fails
  const healedLocator = await ai.healLocator(fragileLocator);
  
  if (healedLocator) {
    console.log(`Original locator failed, using healed locator: ${healedLocator}`);
    await page.locator(healedLocator).fill('newemail@example.com');
  } else {
    // Fallback to a more robust approach
    await page.fill('input[name="email"]', 'newemail@example.com');
  }
  
  // Continue with the test
  await expect(page.locator('input[name="email"]')).toHaveValue('newemail@example.com');
});
```

#### Combining with Traditional Approaches

```typescript
test.ai('robust test with fallback strategy', async ({ page, ai }) => {
  await page.goto('/checkout');
  
  // Try the preferred selector first (fastest)
  const preferredSelector = 'button[data-testid="place-order"]';
  const preferredLocator = page.locator(preferredSelector);
  
  if (await preferredLocator.count() > 0) {
    // Use the fast, reliable selector
    await preferredLocator.click();
  } else {
    // Fall back to AI healing
    console.log('Preferred selector not found, trying AI healing...');
    const healedLocator = await ai.healLocator('button:has-text("Place Order")');
    
    if (healedLocator) {
      await page.locator(healedLocator).click();
    } else {
      // Last resort: find by text content
      await page.click('button:has-text("Place Order")');
    }
  }
  
  // Verify the action succeeded
  await expect(page.locator('.order-confirmation')).toBeVisible();
});
```

### When Self-Healing is Most Useful

1. **Fragile Selectors**: When you must use complex CSS/XPath selectors
2. **Third-Party Components**: When testing components you don't control
3. **Frequent UI Changes**: In applications with rapid UI iterations
4. **Cross-Browser Testing**: When selectors behave differently across browsers
5. **Accessibility Testing**: When verifying elements are accessible by different means

## Best Practices

### 1. Choosing When to Use AI

**Use AI when:**
- Selectors are brittle or likely to change
- You don't have control over element IDs/classes
- Testing based on visual appearance is more reliable than DOM structure
- You want to write tests that resemble user behavior ("click the blue button")
- Maintaining traditional selectors is becoming burdensome

**Stick with traditional selectors when:**
- Elements have stable, unique IDs or data attributes
- Performance is critical (AI adds latency)
- You're testing in environments without internet access
- The element is simple and well-defined (e.g., a specific input by name)

### 2. Writing Effective Tests

**Do:**
- Combine AI with traditional approaches for reliability
- Use descriptive test names that explain what's being tested
- Set consistent viewports for visual testing
- Review AI findings periodically to ensure they're still correct
- Use AI analysis to inform your test strategy, not replace it

**Don't:**
- Rely solely on AI for critical path tests without validation
- Use vague descriptions like "button" or "field"
- Forget to handle cases where AI might not find an element
- Ignore confidence scores returned by AI methods
- Use AI for simple, stable elements where traditional selectors work fine

### 3. Maintenance Guidelines

**Regularly:**
- Review test logs for AI confidence scores
- Check if AI is consistently finding the same elements
- Update descriptions when UI changes significantly
- Verify baseline screenshots are still relevant
- Monitor TestRail for patterns in AI-related test failures

**Quarterly:**
- Assess whether AI features are providing value
- Consider if traditional selector strategies could be improved
- Review the cost/benefit of AI usage (API calls, latency)
- Gather feedback from the QA team on usability

## Troubleshooting

### Common Issues and Solutions

#### 1. AI Not Finding Elements

**Symptoms:**
- Tests fail with "Element not found" errors
- AI returns low confidence scores (< 0.5)
- Fallback selectors work but AI doesn't

**Solutions:**
- Make descriptions more specific
- Add context about where the element is located
- Check if the element is actually visible (not hidden by CSS)
- Verify the element exists in the DOM at the time of the search
- Try using traditional selectors to confirm the element exists

#### 2. Visual Tests Failing Incorrectly

**Symptoms:**
- Tests fail showing differences that don't look significant
- Baseline screenshots look correct
- Differences are in areas expected to change (ads, timestamps)

**Solutions:**
- Increase the threshold value slightly
- Exclude dynamic areas from comparison using selectors
- Ensure consistent timing (wait for animations to complete)
- Check for anti-aliasing or sub-pixel rendering differences
- Update baselines if the changes are intentional

#### 3. Slow Test Execution

**Symptoms:**
- Tests with AI features take significantly longer
- API rate limiting errors from the configured LLM provider
- Tests time out waiting for AI responses

**Solutions:**
- Cache AI results when possible (same description in same test)
- Batch AI requests when testing similar elements
- Consider using a faster AI model for less critical tests
- Run AI-heavy tests in parallel to offset latency
- Monitor API usage and consider a local model server or a provider with higher limits

#### 4. TestRail Integration Issues

**Symptoms:**
- Test results not appearing in TestRail
- Authentication errors
- Missing test case mappings

**Solutions:**
- Verify TestRail credentials in `.env`
- Check that your user has permission to create test runs
- Ensure test cases are properly annotated with `caseId()`
- Check the TestRail API status and your instance health
- Review the TestRail reporter logs for detailed errors

## Examples

### Complete Test Examples

#### Login Test with AI Features

```typescript
import { test, expect } from './framework';

test.ai('complete login flow with AI features', async ({ page, ai }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Use AI to find elements by description
  const emailField = await ai.findElement('email input field');
  const passwordField = await ai.findElement('password input field');
  const loginButton = await ai.findElement('sign in button');
  
  // Perform login
  await emailField.fill('test@example.com');
  await passwordField.fill('securepassword123');
  await loginButton.click();
  
  // Use visual testing to verify dashboard loaded correctly
  await page.waitForURL('/dashboard');
  const visualResult = await ai.compareScreenshot('dashboard-after-login', {
    threshold: 0.03
  });
  
  expect(visualResult.matched).toBe(true);
  
  // Use AI analysis to verify we're on the right page
  const analysis = await ai.analyzePage();
  expect(analysis.title).toContain('Dashboard');
  expect(analysis.interactiveElements).toContain('logout button');
});
```

#### Form Test with Self-Healing

```typescript
import { test, expect } from './framework';

test.ai('registration form with self-healing', async ({ page, ai }) => {
  await page.goto('/register');
  
  // Try to find form using potentially fragile selector
  const formSelector = 'div.container > div.row > div.col-md-6 > form';
  const healedFormSelector = await ai.healLocator(formSelector);
  
  const formLocator = healedFormSelector 
    ? page.locator(healedFormSelector) 
    : page.locator('form#registration-form');
  
  // Fill out the form using AI-found fields
  const firstNameField = await ai.findElement('first name input field', {
    context: 'registration form'
  });
  const lastNameField = await ai.findElement('last name input field', {
    context: 'registration form'
  });
  const emailField = await ai.findElement('email input field', {
    context: 'registration form'
  });
  const passwordField = await ai.findElement('password input field', {
    context: 'registration form'
  });
  
  await firstNameField.fill('John');
  await lastNameField.fill('Doe');
  await emailField.fill('john.doe@example.com');
  await passwordField.fill('SecurePass123!');
  
  // Submit form
  const submitButton = await ai.findElement('register button', {
    context: 'registration form'
  });
  await submitButton.click();
  
  // Verify success
  await expect(page.locator('.success-message')).toContainText('Registration successful');
});
```

#### Visual Test for Data Dashboard

```typescript
import { test, expect } from './framework';

test.ai('data dashboard visual test', async ({ page, ai }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/analytics/dashboard');
  
  // Wait for charts to load
  await page.waitForSelector('.chart-container', { state: 'visible', timeout: 10000 });
  
  // Test each chart individually for better accuracy
  const charts = ['sales-chart', 'user-growth-chart', 'revenue-chart'];
  
  for (const chartId of charts) {
    const result = await ai.compareScreenshot(`chart-${chartId}`, {
      selector: `#${chartId}`,
      threshold: 0.02 // Stricter threshold for charts
    });
    
    expect(result.matched).toBe(true, 
      `Chart ${chartId} differs by ${result.diffPercentage}%`
    );
    
    if (result.aiAnalysis) {
      console.log(`${chartId} analysis:`, result.aiAnalysis);
    }
  }
  
  // Also test the full dashboard layout
  const fullResult = await ai.compareScreenshot('full-dashboard', {
    threshold: 0.07 // More lenient for full page
  });
  
  expect(fullResult.matched).toBe(true);
});
```

## Advanced Usage

### Custom AI Configuration

You can customize the AI behavior by modifying the configuration in `src/framework/ai/types.ts`:

```typescript
// Example: Using a different model or adjusting sensitivity
export const CUSTOM_AI_CONFIG: AIConfig = {
  enabled: true,
  apiKey: process.env.LLM_API_KEY || process.env.OPENAI_API_KEY || '',
  baseUrl: process.env.LLM_BASE_URL, // omit for OpenAI, set it for a local server
  model: 'gpt-4-turbo', // any model your provider offers
  temperature: 0.2, // Lower for more consistent results
  maxRetries: 5,
  enableSelfHealing: true,
  enableVisualTesting: true,
  visualThreshold: 0.03 // 3% threshold
};
```

### Creating Custom AI Helpers

You can extend the AI functionality by creating custom helper functions:

```typescript
// src/framework/ai/custom-helpers.ts
import { AIElementFinder } from './element-finder';

export class CustomAIHelpers {
  constructor(private elementFinder: AIElementFinder) {}
  
  async findElementByText(text: string, exact = false): Promise<any> {
    const description = exact 
      ? `element with exact text "${text}"` 
      : `element containing text "${text}"`;
    
    return this.elementFinder.findElement(description);
  }
  
  async findClickableElementNear(text: string): Promise<any> {
    const description = `clickable element near the text "${text}"`;
    return this.elementFinder.findElement(description);
  }
  
  async findElementByPlaceholder(placeholder: string): Promise<any> {
    const description = `input field with placeholder "${placeholder}"`;
    return this.elementFinder.findElement(description);
  }
}
```

Then use it in your tests:

```typescript
import { test } from './framework';
import { CustomAIHelpers } from '../framework/ai/custom-helpers';

test.ai('custom AI helper usage', async ({ page, ai }) => {
  await page.goto('/search');
  
  const helpers = new CustomAIHelpers(ai.elementFinder);
  
  // Use custom helpers
  const searchBox = await helpers.findElementByPlaceholder('Search products...');
  await searchBox.fill('laptop');
  
  const searchButton = await helpers.findClickableElementNear('Search');
  await searchButton.click();
});
```

## Conclusion

AI-powered testing can significantly improve test resilience and reduce maintenance overhead when used correctly. The key is to:

1. **Use AI as a complement**, not a replacement, for good testing practices
2. **Be specific** in your descriptions to get reliable results
3. **Combine approaches** for maximum reliability
4. **Monitor and maintain** your AI-assisted tests regularly
5. **Leverage AI analysis** to improve your test strategy and coverage

By following the guidelines in this document, QA engineers can create more robust, maintainable tests that adapt to application changes while reducing the burden of selector maintenance.