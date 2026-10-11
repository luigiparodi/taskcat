# GitHub OAuth — BDD Specification (Gherkin)

## Feature: GitHub OAuth Authentication

```gherkin
Feature: Sign in with GitHub
  As a user
  I want to sign in using my GitHub account
  So that I don't have to manage another password

  Background:
    Given the GitHub OAuth App is configured with:
      | client_id     | "dev_client_id" |
      | client_secret | "dev_client_secret" |
      | callback_url  | "http://localhost:5173/auth/github/callback" |
    And the server is running with FRONTEND_URL="http://localhost:5173"
    And the client is running at http://localhost:5173

  @initiation
  Scenario: User clicks "Continue with GitHub" and is redirected to GitHub
    Given I am on the login page
    When I click "Continue with GitHub"
    Then I am redirected to "https://github.com/login/oauth/authorize"
    And the redirect URL contains:
      | param        | value                              |
      | client_id    | "dev_client_id"                    |
      | redirect_uri | "http://localhost:5173/auth/github/callback" |
      | scope        | "read:user user:email"             |
      | state        | <a 32-char random string>         |
    And a cookie "github_oauth_state" is set with the same state value

  @callback_success
  Scenario: Successful GitHub OAuth callback creates a new user and logs them in
    Given a user with email "alice@example.com" does not exist in the database
    And GitHub will return an access token for code "valid_code_123"
    And GitHub will return profile { "id": 42, "email": "alice@example.com", "name": "Alice", "avatar_url": "https://..." }
    When I visit "/auth/github/callback?code=valid_code_123&state=<matching_state>"
    Then the server exchanges the code for an access token
    And the server fetches the GitHub profile
    And a new user is created with provider="github" and providerId="42"
    And the server returns access token, refresh token, and user profile
    And the client stores tokens in memory/localStorage
    And I am redirected to "/projects"
    And I am authenticated as "alice@example.com"

  @callback_existing_user
  Scenario: GitHub OAuth callback links to existing email account
    Given a user exists with email "bob@example.com" and provider="email"
    And GitHub will return profile { "id": 99, "email": "bob@example.com", "name": "Bob" }
    When I visit "/auth/github/callback?code=valid_code_456&state=<matching_state>"
    Then the existing user is updated with provider="github" and providerId="99"
    And the server returns tokens for the existing user
    And I am logged in as "bob@example.com"

  @callback_denied
  Scenario: User denies GitHub consent
    Given I click "Continue with GitHub"
    And I click "Deny" on GitHub's authorization page
    Then GitHub redirects to "/auth/github/callback?error=access_denied"
    And the client shows "You denied the sign in request"
    And I remain on the login page
    And no tokens are stored

  @callback_invalid_code
  Scenario: Invalid or expired authorization code
    Given I visit "/auth/github/callback?code=invalid_code&state=<matching_state>"
    Then the server returns 400 with error "Failed to exchange GitHub code"
    And the client shows "Sign in with GitHub failed"
    And I remain on the login page

  @callback_missing_code
  Scenario: Callback without authorization code
    Given I visit "/auth/github/callback" (no code param)
    Then the client shows "Invalid callback"
    And I am redirected to "/login?error=invalid_callback"

  @callback_state_mismatch
  Scenario: OAuth state parameter mismatch (CSRF protection)
    Given I visit "/auth/github/callback?code=valid_code&state=wrong_state"
    And my cookie has a different state value
    Then the server rejects the request (400)
    And the client shows "Invalid state parameter"

  @missing_env
  Scenario: GitHub OAuth not configured on server
    Given GITHUB_CLIENT_ID is not set
    When I click "Continue with GitHub"
    Then the server returns 500 with "GitHub OAuth is not configured"
    And the client shows "Sign in with GitHub is not available"

  @production_config
  Scenario: Production OAuth flow with Vercel + Render
    Given the GitHub OAuth App has callback URL "https://lp-taskcat.vercel.app/auth/github/callback"
    And Render env vars include GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, FRONTEND_URL="https://lp-taskcat.vercel.app"
    And Vercel env var VITE_API_BASE="https://taskcat-jos6.onrender.com"
    When I click "Continue with GitHub" on https://lp-taskcat.vercel.app/login
    Then I am redirected to GitHub with redirect_uri="https://lp-taskcat.vercel.app/auth/github/callback"
    And after consent, GitHub redirects to https://lp-taskcat.vercel.app/auth/github/callback?code=...
    And the client POSTs to https://taskcat-jos6.onrender.com/auth/github/callback
    And I am logged in and redirected to https://lp-taskcat.vercel.app/projects
```

---

## Test Implementation Notes

### Server Integration Tests (Jest + Supertest)
```typescript
// server/src/__tests__/github-oauth.test.ts
describe('GET /auth/github', () => {
  it('redirects to GitHub with correct params and sets state cookie', async () => {
    const res = await request(app).get('/auth/github').expect(302);
    expect(res.header.location).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize\?/);
    expect(res.header['set-cookie'][0]).toMatch(/github_oauth_state=/);
  });
});

describe('POST /auth/github/callback', () => {
  it('exchanges code for tokens and creates user', async () => {
    // mock fetch for GitHub token + profile
    const res = await request(app)
      .post('/auth/github/callback')
      .send({ code: 'test_code' })
      .set('Cookie', ['github_oauth_state=matching_state'])
      .expect(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.provider).toBe('github');
  });
});
```

### Client E2E Tests (Playwright)
```typescript
// client/e2e/github-oauth.spec.ts
test('GitHub login flow', async ({ page }) => {
  await page.goto('/login');
  await page.click('text=Continue with GitHub');
  // In CI, mock GitHub OAuth or use a test GitHub App
  await expect(page).toHaveURL(/github\.com\/login\/oauth\/authorize/);
  // Complete mock flow...
  await expect(page).toHaveURL('/projects');
});
```

---

## Acceptance Criteria Checklist

- [ ] `GET /auth/github` returns 302 to GitHub with correct query params
- [ ] State cookie set (httponly, secure in prod, lax, 10 min TTL)
- [ ] `POST /auth/github/callback` validates state cookie
- [ ] Successful code exchange → tokens + user (new or linked)
- [ ] Client callback page extracts code, calls API, stores tokens, redirects
- [ ] "Continue with GitHub" button visible on login page
- [ ] Error states handled: denied, invalid code, missing code, state mismatch
- [ ] Dev env works with `http://localhost:5173/auth/github/callback`
- [ ] Prod env works with `https://lp-taskcat.vercel.app/auth/github/callback`