# Contributing Guide

Thank you for your interest in contributing to Personal CRM! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Focus on the code, not the person
- Help others learn and grow
- Report issues constructively

## Getting Started

### 1. Fork the Repository

```bash
# Visit GitHub and click "Fork"
# Clone your fork
git clone https://github.com/YOUR_USERNAME/personal-crm.git
cd personal-crm

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/personal-crm.git
```

### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Create .env.local with Supabase credentials
cp .env.example .env.local
# Edit .env.local with your test Supabase project

# Start development server
npm run dev
```

### 3. Create a Feature Branch

```bash
# Always create a new branch for your work
git checkout -b feature/my-feature-name

# For bug fixes
git checkout -b fix/issue-number-description

# For documentation
git checkout -b docs/what-you-changed
```

## Development Workflow

### Making Changes

1. **Write code** following the style guide (see below)
2. **Write tests** for new functionality
3. **Test locally** before committing
4. **Commit with clear messages** (see below)
5. **Push to your fork**
6. **Create a Pull Request**

### Code Style

#### TypeScript/React

```typescript
// Good: Clear names, proper types
interface ContactFormProps {
  contact?: Contact;
  mode: 'create' | 'edit';
}

export function ContactForm({ contact, mode }: ContactFormProps) {
  // ...
}

// Avoid: Unclear names, missing types
function cf() {
  // ...
}
```

#### File Organization

```typescript
// 1. Imports
import React from 'react';
import { useRouter } from 'next/navigation';

// 2. Types
interface MyComponentProps {
  title: string;
}

// 3. Component
export function MyComponent({ title }: MyComponentProps) {
  return <div>{title}</div>;
}
```

#### CSS/TailwindCSS

```typescript
// Good: Use TailwindCSS classes
<div className="flex items-center justify-between gap-4 p-6 bg-white rounded-lg border border-border">

// Avoid: Inline styles or custom CSS
<div style={{ display: 'flex', alignItems: 'center' }}>
```

### Commit Messages

Follow conventional commits format:

```bash
# Format: <type>(<scope>): <description>

# Examples:
git commit -m "feat(contacts): add contact search functionality"
git commit -m "fix(auth): correct password validation logic"
git commit -m "docs(setup): update Supabase configuration guide"
git commit -m "refactor(tasks): simplify task status update logic"

# Types: feat, fix, docs, refactor, test, chore, perf
```

### Pull Request Process

1. **Update your branch** with latest upstream changes
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Push to your fork**
   ```bash
   git push origin your-branch-name
   ```

3. **Create PR on GitHub** with:
   - Clear title summarizing changes
   - Description of what changed and why
   - Link to any related issues: `Closes #123`
   - Screenshots for UI changes
   - Checklist of testing performed

4. **Example PR Description:**
   ```markdown
   ## Description
   Adds contact search functionality with real-time filtering.

   ## Changes
   - Add search input to contacts page
   - Implement client-side filtering
   - Add keyboard navigation support

   ## Testing
   - [x] Tested with 100+ contacts
   - [x] Tested keyboard shortcuts
   - [x] Tested on mobile device

   Closes #42
   ```

## Types of Contributions

### Bug Fixes

1. **Find the issue**: Write a failing test first
   ```typescript
   test('should not accept invalid email', () => {
     expect(() => validateEmail('not-an-email')).toThrow();
   });
   ```

2. **Fix the code**: Make the test pass
   ```typescript
   function validateEmail(email: string) {
     if (!email.includes('@')) throw new Error('Invalid email');
   }
   ```

3. **Verify**: Run all tests
   ```bash
   npm test
   ```

### New Features

1. **Design first**: Discuss approach in an issue
2. **Implement**: Create feature branch
3. **Test**: Write comprehensive tests
4. **Document**: Add docs if needed
5. **Request review**: Create PR

### Documentation

1. **Fix typos or unclear sections**
2. **Add examples or use cases**
3. **Improve setup instructions**
4. **Update API documentation**

Example:
```bash
git commit -m "docs(integrations): add Gmail setup example"
```

### Tests

Good test contributions:
- Add tests for untested code
- Improve test coverage
- Add E2E tests for critical flows
- Fix flaky tests

## Testing Your Changes

### Before Submitting PR

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Check TypeScript
npx tsc --noEmit

# Format code
npx prettier --write .

# Build for production
npm run build
```

### Writing Tests

```typescript
// Tests should be clear and focused
describe('ContactForm', () => {
  it('should render form fields', () => {
    render(<ContactForm mode="create" />);
    expect(screen.getByLabelText('First Name')).toBeInTheDocument();
  });

  it('should call createContact on submit', async () => {
    const mockCreate = jest.fn();
    render(<ContactForm mode="create" />);
    
    await userEvent.type(screen.getByLabelText('First Name'), 'John');
    await userEvent.click(screen.getByRole('button', { name: /create/i }));
    
    expect(mockCreate).toHaveBeenCalled();
  });
});
```

## Documentation

### Adding Docs

```bash
# Create or update markdown file
nano docs/MY_FEATURE.md

# Follow this structure:
# # Feature Title
# 
# ## Overview
# Brief description
#
# ## Prerequisites
# What's needed
#
# ## Setup
# Step-by-step instructions
#
# ## Examples
# Code examples
#
# ## Troubleshooting
# Common issues
```

## Performance Considerations

### Do

- ✅ Use Server Components for data fetching
- ✅ Implement proper error boundaries
- ✅ Use React.memo for expensive components
- ✅ Optimize database queries with proper indexes
- ✅ Lazy load components when appropriate

### Don't

- ❌ Fetch data on client side when server component is available
- ❌ Use global state for data that changes frequently
- ❌ Make N+1 database queries
- ❌ Load entire datasets when pagination is needed

## Security Considerations

### Do

- ✅ Validate all user inputs with Zod
- ✅ Use RLS policies for data access
- ✅ Encrypt sensitive data
- ✅ Sanitize outputs to prevent XSS
- ✅ Use HTTPS for all communications

### Don't

- ❌ Store secrets in code or env files committed to git
- ❌ Trust client-side validation alone
- ❌ Bypass RLS policies
- ❌ Log sensitive information
- ❌ Expose API keys to the client

## Database Changes

### Adding a Migration

```bash
# Create new migration
npx supabase migration new add_new_table

# Edit migration file
nano supabase/migrations/[timestamp]_add_new_table.sql

# Test locally
npx supabase db reset

# Document the change
```

### Changing Existing Tables

```sql
-- Good: Add new columns as nullable or with defaults
ALTER TABLE contacts ADD COLUMN new_field TEXT DEFAULT '';

-- Avoid: Breaking changes
ALTER TABLE contacts DROP COLUMN important_field;
```

## Review Process

### What Reviewers Look For

- Code follows project style guide
- Tests are comprehensive
- No breaking changes to API
- Documentation is clear
- Performance impact is minimal
- Security best practices are followed

### Addressing Feedback

1. **Understand the concern**: Ask for clarification if needed
2. **Make changes**: Update code based on feedback
3. **Commit: Add new commit explaining the change**
   ```bash
   git commit -m "review: address feedback on ContactForm validation"
   ```
4. **Request re-review**: Add a comment asking for re-review

### Pushing Updates

```bash
# Don't force push to PR branches
git push origin feature-branch

# Don't squash unless asked
git rebase -i upstream/main  # Only if instructed
```

## Useful Commands

```bash
# Check what changed since last commit
git diff

# See commit history
git log --oneline

# Undo last commit (keep changes)
git reset --soft HEAD~1

# Undo uncommitted changes
git checkout .

# Find specific code
grep -r "function_name" src/

# Format all files
npx prettier --write .
```

## Getting Help

### Resources

- 📖 [Project Documentation](./docs)
- 💬 [GitHub Discussions](https://github.com/owner/personal-crm/discussions)
- 🐛 [Issue Tracker](https://github.com/owner/personal-crm/issues)
- 📚 [TypeScript Docs](https://www.typescriptlang.org/docs/)
- 🎨 [React Docs](https://react.dev)

### Asking Questions

- Search existing issues/discussions first
- Provide context and examples
- Include error messages and screenshots
- Describe what you've already tried

### Reporting Bugs

```markdown
## Description
Clear description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: macOS 13.5
- Node: 18.17.0
- Browser: Chrome 115
```

## Recognition

Contributors will be recognized in:
- [CONTRIBUTORS.md](./CONTRIBUTORS.md) file
- GitHub contributor graph
- Release notes

Thank you for contributing! 🎉

---

**Happy coding!** If you have questions, don't hesitate to ask. We're here to help!
