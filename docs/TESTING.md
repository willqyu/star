# Testing Guide

This guide covers testing strategies for the Personal CRM application.

## Test Types

### 1. Unit Tests

Test individual functions and utilities in isolation.

**Example: Testing validation schemas**

```typescript
import { ContactFormSchema } from '@/lib/validation/schemas';

describe('Contact Validation', () => {
  it('should validate valid contact data', () => {
    const data = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    };
    expect(ContactFormSchema.parse(data)).toEqual(data);
  });

  it('should reject invalid email', () => {
    const data = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'not-an-email',
    };
    expect(() => ContactFormSchema.parse(data)).toThrow();
  });
});
```

### 2. Integration Tests

Test multiple components working together.

**Example: Testing contact creation flow**

```typescript
describe('Contact Creation Flow', () => {
  it('should create contact and retrieve it', async () => {
    const supabase = createClient();
    
    // Create contact
    const contact = await createContact('user-id', {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
    });
    
    // Retrieve contact
    const retrieved = await getContactById(contact.id);
    
    expect(retrieved?.first_name).toBe('John');
  });
});
```

### 3. End-to-End (E2E) Tests

Test complete user workflows using Playwright.

**Example: Testing the signup flow**

```typescript
import { test, expect } from '@playwright/test';

test('user can sign up and create a contact', async ({ page }) => {
  // Navigate to signup
  await page.goto('/auth/signup');
  
  // Fill form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.fill('input[name="confirmPassword"]', 'password123');
  
  // Submit
  await page.click('button:has-text("Sign Up")');
  
  // Verify redirect
  await expect(page).toHaveURL('/auth/login');
});
```

## Running Tests

### Unit & Integration Tests

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

### E2E Tests (Playwright)

```bash
# Install Playwright (one-time)
npx playwright install

# Run tests
npx playwright test

# Run in debug mode
npx playwright test --debug

# View test report
npx playwright show-report
```

## Setting Up Testing

### 1. Install Testing Dependencies

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
npm install --save-dev playwright @playwright/test
```

### 2. Create jest.config.js

```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### 3. Create jest.setup.js

```javascript
import '@testing-library/jest-dom'
```

### 4. Create playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

## Test Coverage Goals

- **Unit Tests**: Aim for 80%+ coverage on utilities and schemas
- **Integration Tests**: Cover all major API interactions
- **E2E Tests**: Cover critical user flows (signup, create contact, create task)

## Testing Best Practices

### 1. Isolation

- Mock external services (Supabase, APIs)
- Use test databases for integration tests
- Isolate tests to avoid side effects

### 2. Clarity

```typescript
// Good: Clear test names that describe behavior
test('should create a contact with valid data', () => {});
test('should reject contact with empty first name', () => {});

// Avoid: Unclear names
test('test contact', () => {});
test('test 1', () => {});
```

### 3. Assertions

```typescript
// Good: Specific assertions
expect(contact.first_name).toBe('John');
expect(contact.email).toBe('john@example.com');

// Avoid: Vague assertions
expect(contact).toBeTruthy();
```

### 4. Mocking

```typescript
// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({
      data: { id: '123', first_name: 'John' },
    }),
  })),
}));
```

## Example Test Suite

### contacts.test.ts

```typescript
import { createContact, getContact, deleteContact } from '@/lib/utils/contacts';
import { ContactFormSchema } from '@/lib/validation/schemas';

describe('Contacts', () => {
  describe('Validation', () => {
    it('should validate correct contact data', () => {
      const data = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      };
      expect(() => ContactFormSchema.parse(data)).not.toThrow();
    });

    it('should reject contact with missing first name', () => {
      const data = {
        last_name: 'Doe',
        email: 'john@example.com',
      };
      expect(() => ContactFormSchema.parse(data)).toThrow();
    });

    it('should reject invalid email format', () => {
      const data = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'not-an-email',
      };
      expect(() => ContactFormSchema.parse(data)).toThrow();
    });
  });

  describe('CRUD Operations', () => {
    it('should create a contact', async () => {
      const contact = await createContact('user-id', {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
      });

      expect(contact.id).toBeDefined();
      expect(contact.first_name).toBe('John');
    });

    it('should retrieve a contact by id', async () => {
      const created = await createContact('user-id', {
        first_name: 'John',
        last_name: 'Doe',
      });

      const retrieved = await getContact(created.id);

      expect(retrieved?.id).toBe(created.id);
    });

    it('should delete a contact', async () => {
      const contact = await createContact('user-id', {
        first_name: 'John',
        last_name: 'Doe',
      });

      await deleteContact(contact.id);

      const retrieved = await getContact(contact.id);
      expect(retrieved).toBeNull();
    });
  });
});
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm test
      
      - name: Run type check
        run: npx tsc --noEmit
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

## Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode with inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debug

```bash
# Run Playwright with inspector UI
npx playwright test --debug
```

### Console Logs

```typescript
test('debug test', () => {
  const value = calculateSomething();
  console.log('Debug value:', value);
  expect(value).toBe(expected);
});
```

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Supabase Testing](https://supabase.com/docs/guides/testing)

## Troubleshooting

### Common Issues

**Issue: Tests timeout**
```bash
# Increase timeout
jest.setTimeout(10000);
```

**Issue: Supabase client not mocking properly**
```typescript
// Clear all mocks before test
beforeEach(() => {
  jest.clearAllMocks();
});
```

**Issue: Playwright can't find element**
```typescript
// Wait for element
await page.waitForSelector('button:has-text("Create")');
```

---

For more information, check the test files in your repository or refer to the links above.
