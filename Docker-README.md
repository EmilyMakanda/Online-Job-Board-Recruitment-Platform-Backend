# Online Job Board / Recruitment Platform — Backend API

COM311 Software Engineering project, Group CC6.

A REST API that connects job seekers and employers: registration and login, company profiles, job postings, applications and notifications. Built with NestJS, TypeORM and Oracle Database, packaged with Docker.

### Steps
1. Clone the repository and open the project folder.
2. Copy `.env.example` to `.env` and fill in the values (see "Settings" below).
3. Start everything:

   ```
   docker compose up --build
   ```

4. **Be patient on the first start.** Oracle takes about 10 to 15 minutes to initialise. The API starts automatically once the database is healthy. Later starts take under a minute.
5. When you see `Nest application successfully started`, open:
   - API: `http://localhost:3002`
   - Interactive documentation (Swagger): `http://localhost:3002/docs`

### Stopping and resetting
- Stop, keeping all data: `docker compose down`
- Stop and delete all data (database and uploads): `docker compose down -v`
- Follow the API log: `docker compose logs -f api`
- Database only (no API): `docker compose up oracle-db`

## Using the API

Everything is documented in Swagger at `/docs`, including request and response shapes.

| Area | Base path |
| --- | --- |
| Authentication | `/authentication` (register, verify-email, resend-verification, login, logout) |
| Users | `/users` |
| Companies | `/companies` |
| Jobs | `/job` (note: singular), `/job/my-jobs`, `/job/search` |
| Applications | `/applications` |
| Notifications | `/notifications` |
| Admin | `/admin` |

**Authenticating:**
1. Register with `POST /authentication/register`. The role is `job_seeker` or `employer`.
2. Verify the email address with `POST /authentication/verify-email`.
3. Log in with `POST /authentication/login` and copy the token from the response.
4. Send it on protected requests as `Authorization: Bearer <token>`. In Swagger, press **Authorize** and paste the token.

Some endpoints are restricted by role. For example, only employers can create jobs.

**Test accounts:** TODO — add the seeded or pre-verified accounts once they exist.

## Settings

Settings come from the `.env` file, which is never committed. `.env.example` lists them all.

| Setting | Purpose |
| --- | --- |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_SERVICE_NAME` | Database account. Compose uses these to create the database and for the API. Defaults exist for demo use. |
| `JWT_SECRET` | Secret used to sign login tokens. Required. |
| Mail settings | TODO — list the SMTP variable names used by the email service. |
| `DB_SYNCHRONIZE` | `true` lets the API create or alter tables from the code. Compose enables it for the demo database. **Set it to `false` for any database that holds real data.** |
| `ORACLE_HOST_PORT` | Optional. Change the database port published on your machine if 1521 is taken. |

`DB_HOST` and `DB_PORT` are set by compose and don't need to be in `.env`.

## Troubleshooting

- **"Port is already allocated":** something already uses 3002 or 1521. Stop it, or set `ORACLE_HOST_PORT` for the database.
- **The API keeps restarting:** run `docker compose logs api` and read the first error. The database may still be starting.
- **`ORA-00904: invalid identifier`:** the database tables don't match the current code, usually from an older database volume. Run `docker compose down -v` and start again.
- **Docker feels frozen or the engine errors on first start:** Oracle's first start is heavy. Close other programs and raise Docker's memory limit.
- **Verification email doesn't arrive:** see "Known limitations".

## Known limitations

- Email verification depends on the mail service configuration. TODO — describe how to get the verification code during development.
- `/notifications/test-email` is a development helper and should be removed or protected before any real deployment.
- The API port (3002) is fixed in the code.
- `DB_SYNCHRONIZE=true` is for demos only. A real deployment needs migrations.
- The image contains the code on the branch it was built from. Features merged after that aren't included.

## Tech stack

NestJS, TypeORM, Oracle Database 21c XE, JWT with Passport, Swagger (OpenAPI), Docker and Docker Compose.

## Project structure

- `src/authentication` — registration, login, guards, roles
- `src/users`, `src/company`, `src/jobs`, `src/applications`, `src/notification`, `src/admin` — feature modules
- `Dockerfile`, `docker-compose.yaml` — container setup