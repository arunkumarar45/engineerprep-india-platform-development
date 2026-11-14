# Google OAuth 2.0 & OpenID Connect Authentication Setup Guide

This guide walks through configuring and activating Google Sign-In for EngineerPrep India in development and production environments.

---

## 1. Architecture & Security Overview

EngineerPrep India implements an enterprise-grade Google OAuth 2.0 / OpenID Connect (OIDC) flow:

1. **Authorization Code Flow:** The frontend navigates to `/api/v1/auth/google`, which generates a cryptographically secure random `state` and `nonce`, writes an encrypted/HTTP-only cookie (`epi_oauth_state`), and redirects to Google's consent screen.
2. **CSRF Mitigation:** Google redirects back to `/api/v1/auth/google/callback?code=...&state=...`. The callback strictly checks the returned `state` against the HTTP-only cookie.
3. **Cryptographic JWKS Verification:** ID tokens received from Google's token endpoint (`https://oauth2.googleapis.com/token`) are verified cryptographically against Google's live public JWKS keyset (`https://www.googleapis.com/oauth2/v3/certs`) using `jose`. The signature, audience (`GOOGLE_CLIENT_ID`), issuer (`https://accounts.google.com`), and expiration are verified.
4. **Verified Email Enforcement:** Only Google accounts with `email_verified: true` are permitted to authenticate.
5. **Account Linking:**
   - If a user has already registered via email and password, signing in with Google automatically links the Google account (`google_id`) and marks `email_verified = true` without duplicating records.
   - If the user is new, a new account is provisioned with `role = "STUDENT"` and an unguessable random password hash.
6. **Session Management:** The platform issues the standard `epi_access` (15 min) and `epi_refresh` (7 days) HTTP-only cookies, recording the session and rotating tokens with reuse detection.

---

## 2. Google Cloud Console Setup

### Step 1: Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Click the project dropdown in the top-left and select **New Project**.
3. Name the project `EngineerPrep India` (or your chosen name) and click **Create**.

### Step 2: Configure OAuth Consent Screen
1. In the sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in the required fields:
   - **App name:** `EngineerPrep India`
   - **User support email:** Select your administrator email.
   - **App logo:** Optional (recommended for production).
   - **Developer contact information:** Your administrator email.
4. Click **Save and Continue**.
5. On the **Scopes** page, click **Add or Remove Scopes** and select:
   - `.../auth/userinfo.email` (`email`)
   - `.../auth/userinfo.profile` (`profile`)
   - `openid`
6. Click **Update** and then **Save and Continue**.
7. In development, under **Test users**, add your personal Google account emails to allow testing before public publishing.

### Step 3: Create OAuth 2.0 Credentials
1. In the sidebar, navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. Set **Application type** to **Web application**.
4. Set **Name** to `EngineerPrep India Web Client`.
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:3000` (development)
   - `https://engineerprep.in` (production domain)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/api/v1/auth/google/callback` (development)
   - `https://engineerprep.in/api/v1/auth/google/callback` (production)
7. Click **Create**.
8. Copy the generated **Client ID** and **Client Secret**.

---

## 3. Environment Variable Configuration

Add the credentials to your environment file (`.env` or production secrets):

```env
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID="1234567890-abcdefg.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-yourClientSecretHere"
GOOGLE_CALLBACK_URL="http://localhost:3000/api/v1/auth/google/callback"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

In production, update URLs to your custom domain:
```env
GOOGLE_CALLBACK_URL="https://engineerprep.in/api/v1/auth/google/callback"
NEXT_PUBLIC_APP_URL="https://engineerprep.in"
```

---

## 4. Testing & Validation

1. Start the application:
   ```bash
   npm run dev
   ```
2. Open `http://localhost:3000/login` or `http://localhost:3000/register`.
3. Click **Continue with Google** / **Sign up with Google**.
4. Authenticate using your Google test account.
5. You will be redirected back to `/dashboard` with active session cookies (`epi_access` and `epi_refresh`).

---

## 5. Error Code Reference

When an error occurs, the callback redirects to `/login?error=<code>`. The login page automatically parses these codes into user-friendly messages:

| Error Code | Cause | Resolution |
|---|---|---|
| `google_not_configured` | `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is unset | Populate credentials in `.env` |
| `google_access_denied` | User clicked "Cancel" on Google consent screen | Expected behavior when user aborts |
| `state_mismatch` / `invalid_state` | Cookie tampered or CSRF state mismatched | Ensure cookies are enabled in browser |
| `state_expired` | More than 10 minutes elapsed before completing OAuth | Click Continue with Google again |
| `unverified_google_email` | Google account has an unverified email address | User must verify their Google email |
| `account_deactivated` | User account was disabled by an administrator | Contact platform administrator |
| `auth_failed` | Generic token exchange or network error | Verify network connectivity and Google secrets |

