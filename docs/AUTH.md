### Configure verification email (Gmail)

For Gmail SMTP, use an **App Password**, not your normal Google account
password. App Passwords require 2-Step Verification to be enabled on the Google
account. Create one in the Google Account's **Security → App passwords** page
and use its generated password for `SMTP_PASSWORD` (omit any display spaces).
Alternatively, configure Gmail OAuth with the OAuth variables shown below.

Add these values to the local, untracked `.env` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-address@gmail.com
SMTP_PASSWORD=your-16-character-app-password
SMTP_FROM=your-address@gmail.com
API_URL=http://localhost:3000
```

Port `465` uses implicit TLS (`SMTP_SECURE=true`). Alternatively, Gmail port
`587` uses STARTTLS (`SMTP_SECURE=false`). If `SMTP_SECURE` is omitted, the
application selects implicit TLS for port `465` and STARTTLS otherwise.
`SMTP_USER` and `SMTP_FROM` should normally identify the same sender.
Never commit `.env` or put real credentials in source code.

The OAuth option uses these settings instead of `SMTP_PASSWORD`:

```env
SMTP_USER=your-address@gmail.com
SMTP_CLIENT_ID=your-oauth-client-id
SMTP_CLIENT_SECRET=your-oauth-client-secret
SMTP_REFRESH_TOKEN=your-oauth-refresh-token
SMTP_FROM=your-address@gmail.com
```

### Protecting user endpoints

The `/users` endpoints require a valid JWT access token. First log in through
`POST /authentication/login`, then include the returned token on each request:

```http
Authorization: Bearer <access_token>
```

Tokens are signed with `JWT_SECRET` and expire after one day. Registration,
email verification, and login remain public so users can obtain an access
token. Creating, updating, and deleting job listings require a valid token
belonging to an `employer`; listing and retrieving jobs remain public.

`POST /authentication/logout` requires a bearer token. Access tokens are
stateless and are not revoked by this endpoint, so the client must discard its
token after a successful logout. The token remains usable until it expires.
