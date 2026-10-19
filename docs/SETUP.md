# Team Setup & Troubleshooting Guide: Local Development Environment

This guide provides an overview of recent changes to the project architecture, environment setup instructions for team members, and troubleshooting steps if your local environment breaks.

---

## 📌 Summary of Recent Updates

We have updated the project infrastructure to standardize local database configuration and project modules across all environments:

1. **Local Database Standardization:** Added `docker-compose.yml` configured with Oracle 21c (`gvenzl/oracle-xe:21-slim`).
2. **TypeORM & Environment Integration:** Integrated `@nestjs/typeorm` and `@nestjs/config` into `AppModule` to dynamically load `.env` parameters.
3. **Core Database Entities:** Created initial TypeORM entity models in `src/entities/`:
   - `User` (`users`)
   - `Job` (`jobs`)
   - `Application` (`applications`)
   - `Notifications`(`notifications`)
   - `Authentication`(`auth`)
4. **Core Feature Modules:** Scaffolding created for `AuthModule`, `JobsModule`, and `ApplicationsModule`.

---

## 🛠️ Environment Setup & Quickstart

Follow these steps whenever pulling updates or setting up your environment on a new machine.

### 1. Prerequisites
Ensure you have the following installed locally:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- Node.js (v18+) and `npm`

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in the root directory (`job-board-backend/.env`) if it does not exist yet. Ensure the database credentials match `docker-compose.yml`:

```env
# Application Port
PORT=3000

# Oracle 21c Database Settings
PORT=3000
DB_HOST=localhost
DB_PORT=1521
DB_USERNAME=job_board_user
DB_PASSWORD=JobBoardPassword123!
DB_SERVICE_NAME=job_board_pdb
DB_SYNCHRONIZE=true
JWT_SECRET=your_jwt_secret_key_here
```

> ⚠️ **Note:** Do **NOT** commit your local `.env` file to Git.

### Configure verification email (Gmail)

For Gmail SMTP, use an **App Password**, not your normal Google account
password. App Passwords require 2-Step Verification to be enabled on the Google
account. Create one in the Google Account's **Security → App passwords** page
and use its generated password for `SMTP_PASSWORD` (omit any display spaces).
If App passwords are unavailable for your account, use an SMTP provider that
supports password authentication or configure an OAuth-based mail integration.

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
application selects implicit TLS for port `465` and STARTTLS otherwise. The
`SMTP_USER` and `SMTP_FROM` addresses should normally be the same Gmail account.
Never commit `.env` or put real credentials in source code.

### 3. Install Project Dependencies
Run the following command to download new packages (`typeorm`, `oracledb`, `@nestjs/config`):

```bash
npm install
```

### 4. Start the Oracle Database
Launch the database container using Docker Compose:

```bash
docker compose up -d
```

To verify that the database has fully initialized, run:

```bash
docker compose logs -f oracle-db
```

Wait until you see `DATABASE IS READY TO USE!` in the logs, then press `Ctrl + C` to exit log streaming.

### 5. Launch the NestJS Application

```bash
npm run start:dev
```

When started, TypeORM will connect to Oracle 21c and automatically sync entities, creating or updating database tables as needed.

---

## 🚨 Troubleshooting Guide ("If Anything Breaks")

### Issue 1: Port `1521` is Already Allocated
**Symptom:**  
`Error response from daemon: driver failed programming external connectivity on endpoint ... Bind for 0.0.0.0:1521 failed: port is already allocated`

**Cause:**  
Another local Oracle instance, background service, or leftover Docker container is already using port `1521`.

**Fix:**
1. Check running Docker containers:
   ```bash
   docker ps
   ```
2. Stop competing Oracle containers or manual standalone instances:
   ```bash
   docker stop <container_id_or_name>
   ```
3. Restart Docker Compose:
   ```bash
   docker compose up -d
   ```

---

### Issue 2: `ORA-12514` / Connection Refused
**Symptom:**  
NestJS crashes on start with `Error: ORA-12514: TNS:listener does not currently know of service requested in connect descriptor` or connection refused.

**Cause:**  
NestJS attempted to connect while Oracle was still performing its internal initial boot sequence.

**Fix:**
1. Verify database readiness:
   ```bash
   docker compose logs oracle-db
   ```
2. Wait for `DATABASE IS READY TO USE!`.
3. If the error persists, ensure your `.env` contains `DB_SERVICE_NAME=job_board-pdb`.

---

### Issue 3: Corrupted Database State or Entity Schema Conflicts
**Symptom:**  
TypeORM entity schema synchronization fails or throws SQL sequence/table errors after merging code from `main`.

**Fix (Full DB Reset):**  
Since local development data is disposable, tear down the container and volume to rebuild a clean Oracle database:

```bash
# 1. Stop container and delete data volume
docker compose down -v

# 2. Re-create clean database instance
docker compose up -d

# 3. Wait until DB is ready, then restart application
npm run start:dev
```

---

### Issue 4: Missing Dependencies or `node_modules` Mismatch
**Symptom:**  
`Cannot find module ...` or TypeScript build failures after pulling changes.

**Fix:**  
Clean install all dependencies:

```bash
rm -rf node_modules package-lock.json
npm install
```
*(On Windows PowerShell, use `Remove-Item -Recurse -Force node_modules, package-lock.json`)*

---

## 🌿 Git Branch Workflow Best Practice

To pull the latest team changes without risking uncommitted work on your branch:

```bash
# 1. Commit your local work
git add .
git commit -m "WIP: my current feature updates"

# 2. Fetch latest changes from main
git fetch origin

# 3. Merge main into your working branch
git merge origin/main

# 4. Re-install and start dev server
npm install
npm run start:dev
```