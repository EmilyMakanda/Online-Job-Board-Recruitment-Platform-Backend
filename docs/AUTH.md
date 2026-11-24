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

API endpoints are versioned under `/api/v1`. The `/api/v1/users` endpoints
require a valid JWT access token. First log in through
`POST /api/v1/authentication/login`, then include the returned token on each request:

```http
Authorization: Bearer <access_token>
```

Tokens are signed with `JWT_SECRET` and expire after one day. Each protected
request also reloads the account from Oracle, so deleted or deactivated users
cannot continue using an existing token. Job-seeker registration is available
at `POST /api/v1/authentication/register`; employer registration is available at
`POST /api/v1/authentication/register/employer`. The backend assigns these roles
without accepting a role from the request. Employers create and manage their
company separately through `/api/v1/companies`. Email verification and login remain
public so users can obtain an access token.

Job postings are created in a pending state. Only administrators can approve
them, after which they become visible to job seekers. Employers can access only
their own postings and their job applications.

All `/api/v1/admin` endpoints require a JWT whose current database role is `admin`.
Administrators can manage accounts, employers/companies, job moderation,
applications, reports, and statistics. The endpoints
`PATCH /api/v1/admin/users/:id/activate` and `PATCH /api/v1/admin/users/:id/deactivate`
manage account activity; an administrator cannot deactivate their own account.
Admin collection endpoints and `GET /api/v1/users` accept `page` (default `1`) and
`limit` (default `50`, maximum `100`) query parameters; results remain arrays
and are ordered newest first.
Public registration and profile updates never assign roles. Bootstrap the
first administrator with the one-time `npm run seed:admin` command after
building the project. Set `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` only in
the environment used for that command; `ADMIN_SEED_NAME` is optional. The
command creates a verified admin with a hashed password, does nothing if an
active, verified admin already exists, and fails if the configured email is
already used by a non-admin account. Do not expose administrator role
assignment in the public API or run the seed automatically when the server
starts.

Authenticated job seekers and employers can submit a report through
`POST /api/v1/reports`. Administrators review reports through
`GET /api/v1/admin/reports` and resolve or dismiss them with
`PATCH /api/v1/admin/reports/:id/status`.

The Swagger UI is served at `http://localhost:3000/api/docs` by default (or
the configured `PORT`). Use **Authorize** with the access token returned by
`POST /api/v1/authentication/login`; enter the token value without adding a `Bearer`
prefix because Swagger supplies the bearer scheme.

`POST /api/v1/authentication/logout` requires a bearer token. Access tokens are
stateless and are not revoked by this endpoint, so the client must discard its
token after a successful logout. The token remains usable until it expires.
