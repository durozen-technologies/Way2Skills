# Way2Skills API

Separate FastAPI backend for PostgreSQL-backed courses, contact enquiries,
admission applications, and administrator access. The existing Google Apps
Script form-submission flow remains unchanged; the admission form reads
published course options from this API but continues to submit through the
existing integration. No email delivery is implemented here.

## Requirements

- Windows PowerShell
- Python 3.12 (Python 3.11+ is required by the code)
- PostgreSQL 15 or newer, running locally

## 1. Create and activate a virtual environment

```powershell
Set-Location 'C:\Users\user\OneDrive\Desktop\way2skills\backend'
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, enable scripts for this terminal only:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

## 2. Install dependencies

```powershell
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
```

## 3. Configure environment variables

```powershell
Copy-Item .env.example .env
notepad .env
```

Set `DATABASE_URL` to the PostgreSQL role/database you create below. Generate a
new private signing key and put its output in `JWT_SECRET` in `.env`:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(48))"
```
Set `ENV=development` locally. Documentation is also enabled for other
non-production environments such as staging. In the production hosting
platform's environment-variable settings, set `ENV` to `production`; do not
rely on the local `.env` file for a deployed application. This disables
`/docs`, `/redoc`, and `/openapi.json` but does not protect API routes or replace
authentication and authorization.

python -m app.cli create-admin
Do not commit `.env` or put database credentials/JWT secrets in a `NEXT_PUBLIC_`
variable. Configure `FRONTEND_ORIGINS` as a comma-separated list of exact
origins, with no trailing slash (for example,
`http://localhost:3000,http://127.0.0.1:3000`). Wildcard origins are rejected.
The backend defaults to those two local frontend origins if this setting is
omitted.

`frontend/.env.example` documents
`NEXT_PUBLIC_WAY2SKILLS_API_URL=http://127.0.0.1:8000`. Add that setting
manually to the frontend's existing `.env.local` if needed; do not replace its
existing Apps Script setting. The homepage, course details, internship listing,
admission course selector, and admin course editor use this API. Admission
submissions still use the existing Apps Script integration.

The frontend admin dashboard is available at `/admin`. It uses the existing
admin login and in-memory bearer token for dashboard records and course
management. The token is cleared on reload. The UI has not been end-to-end
tested against a configured PostgreSQL database.

## 4. Create a local PostgreSQL role and database

Ensure the local PostgreSQL service is running, then open a PostgreSQL
superuser session:

```powershell
psql -U postgres -h 127.0.0.1 -d postgres
```

At the `postgres=#` prompt, create a local role, set its password using
PostgreSQL's non-echoing password prompt, and create a new application database:

```sql
CREATE ROLE way2skills LOGIN;
\password way2skills
CREATE DATABASE way2skills OWNER way2skills;
\q
```

Use the password you set only in the backend `DATABASE_URL` in `.env`, URL
encoding special characters when needed. These commands create a new database;
they do not drop, reset, or recreate any existing database.

## 5. Run Alembic migrations

```powershell
alembic upgrade head
```

`alembic upgrade head` applies the foundation, course, UUID, feedback, and
course-details migrations, followed by the archiveable course-category
registry, the course-content limits migration, the optional legacy course
internship-period migration, and separate internship catalogue, cover image,
and learning outcome migrations.
The category migration copies existing distinct category names into the
registry; it does not modify or delete course rows.
The UUID migration assigns UUID primary keys to admins, contacts, admissions,
and courses while retaining each existing integer ID in a unique `legacy_id`
column. Existing rows and their data are preserved; legacy integer record URLs
and admin tokens continue to resolve through that mapping.
The feedback migration adds one new table with UUID IDs and pending approval as
the default. It does not alter or remove existing tables or records.
The course-details migration adds nullable curriculum and benefits fields and a
JSON certificate-selection field defaulting to an empty list. Existing course
prices, image URLs, and other data are preserved.
The course-category migration creates a category registry for admin-managed
availability. Archiving a category leaves each course's saved category text
and all course data unchanged.
The course-content limits migration changes the short description column from
`VARCHAR(300)` to `TEXT`; this preserves existing content and accommodates
future description limit changes.
The internship-period migration adds a nullable positive whole-month duration
to legacy course records. It is not used to create or display internship
opportunities.
The separate internship migration creates an independent internship table and
does not convert or modify existing course records.
Later internship migrations add an optional cover image URL and a list of
learning outcomes while preserving existing internship records.
Existing description content is preserved.

## 6. Create the first administrator

```powershell
python -m app.cli create-admin
```

The command prompts for the email and a password (12–128 characters), then
prompts for the password again without echoing it. Only an Argon2 password hash
is stored. There is no public admin-registration endpoint.

## 7. Start the API

```powershell
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

The development server binds to loopback only.

## 8. Open Swagger UI

Open <http://127.0.0.1:8000/docs>. The health endpoint is
<http://127.0.0.1:8000/api/health>.

## 9. Run the tests

```powershell
python -m pytest
python -m compileall app
```

Automated tests use an in-memory SQLite database isolated to the test process;
SQLite is not an application database option. These tests cover API validation,
auth, database-session behavior, and admin workflows but do not establish that
this machine's PostgreSQL credentials, migrations, or PostgreSQL integration
work. PostgreSQL-specific integration checks require a separately configured,
disposable test database.

## Endpoints

All API routes are under `/api`:

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | Application and database connectivity |
| `POST` | `/contact` | Public | Create a contact enquiry |
| `POST` | `/admissions` | Public | Create an admission application |
| `GET` | `/feedback` | Public | List approved student feedback |
| `POST` | `/feedback` | Public | Submit feedback for review |
| `POST` | `/auth/login` | Public | Authenticate an active admin and return a short-lived JWT |
| `GET` | `/auth/me` | Admin JWT | Current administrator |
| `GET` | `/admin/dashboard` | Admin JWT | Current total/new/pending counts |
| `GET` | `/admin/contacts` | Admin JWT | Search/filter/paginate contact enquiries |
| `GET` | `/admin/contacts/{id}` | Admin JWT | Contact enquiry detail |
| `PATCH` | `/admin/contacts/{id}` | Admin JWT | Update contact status |
| `GET` | `/admin/admissions` | Admin JWT | Search/filter/paginate admission applications |
| `GET` | `/admin/admissions/{id}` | Admin JWT | Admission application detail |
| `PATCH` | `/admin/admissions/{id}` | Admin JWT | Update admission status |
| `GET` | `/courses` | Public | List published offerings |
| `GET` | `/courses/{slug}` | Public | Published offering details |
| `GET` | `/internships` | Public | Published records from the separate internship catalogue |
| `GET` | `/internships/{slug}` | Public | Published internship detail |
| `GET` | `/programmes` | Public | Published programmes only |
| `GET` | `/admin/courses` | Admin JWT | Search/filter/paginate all courses |
| `POST` | `/admin/courses` | Admin JWT | Create a course |
| `GET` | `/admin/courses/{id}` | Admin JWT | Retrieve a course for editing |
| `PATCH` | `/admin/courses/{id}` | Admin JWT | Edit or publish/unpublish a course |
| `DELETE` | `/admin/courses/{id}` | Admin JWT | Delete if no admission references it |
| `GET` | `/admin/internships` | Admin JWT | Search/filter/paginate internship records |
| `POST` | `/admin/internships` | Admin JWT | Create a separate internship |
| `GET` | `/admin/internships/{id}` | Admin JWT | Retrieve an internship for editing |
| `PATCH` | `/admin/internships/{id}` | Admin JWT | Edit or publish/unpublish an internship |
| `DELETE` | `/admin/internships/{id}` | Admin JWT | Delete an internship |
| `GET` | `/admin/categories` | Admin JWT | List available course categories and their course counts |
| `DELETE` | `/admin/categories?name={name}` | Admin JWT | Archive a category without changing its courses |
| `GET` | `/admin/feedback` | Admin JWT | List all feedback submissions |
| `PATCH` | `/admin/feedback/{id}` | Admin JWT | Approve or reject submitted feedback |
| `DELETE` | `/admin/feedback/{id}` | Admin JWT | Delete a feedback submission |

List endpoints accept `limit` (1–100, default 20), `offset` (0–1,000,000,
default 0), `search` (up to 100 characters), and `status`. Contact statuses are
`new`, `in_progress`, and `resolved`. Admission statuses are `pending`,
`in_progress`, `accepted`, and `rejected`.

`/courses` returns published `course` offerings and `/programmes` returns
published programme course records. `/internships` returns only records from the
separate internship catalogue; legacy course records with type `internship` are
not exposed as internship opportunities. Public list responses include
published records only. Admin course list endpoints accept
`limit` (1–100), `offset`, `search`, `course_type`,
`category`, and `is_published`. A course stores its title/unique slug,
descriptions, category/type, duration, level, delivery mode, optional image and
price, syllabus entries, optional card theme, publication/featured flags, and
display order. Valid types are `course`, `internship`, and `programme`; existing
`internship`-type course records remain for compatibility and are not separate
internship opportunities. Valid themes are `sky`, `mint`, `amber`, and
`violet`. Public routes never return
unpublished offerings. Levels are `Beginner`, `Intermediate`, or `Advanced`;
records with legacy level values remain unchanged unless an administrator
selects a new level. Curriculum and benefits are optional multiline text fields,
and certificates are an optional list of supported completion certificates.
The image URL and price are optional. Deleting a course referenced by an
admission is rejected with HTTP 409.

Internships are stored independently from courses. Each record requires a title,
unique slug, short/full descriptions, and positive duration in whole months.
Cover image, eligibility, skills, learning outcomes, internship type, stipend
details, dates, positions, application instructions, and application URL are
optional. Admin internship list endpoints support `limit`, `offset`, `search`,
and `is_published`.

The frontend exposes `/cart` and `/internships/{slug}`. Cart contents are
browser-local and persisted across frontend navigation/reloads. This repository
does not provide a payment checkout route: courses continue to the existing
admissions form, while internships use their optional application URL or
details page.

Contact submission accepts `name`, `email`, `message`, and optional `phone` and
`topic`. Admission submission accepts `name`, `email`, `phone`, `education`,
`course` (the published course/programme slug), and optional `message`.
Supported education values are `school`, `diploma`, `undergraduate`,
`graduate`, and `other`. Public submission responses contain only the new
record ID, initial status, and creation time; they do not echo submitted
personal data. Admin detail/list responses are protected and include the
requested record fields. Responses omit database credentials and hashes;
validation errors do not echo submitted values.

## Course management workflow

1. Apply migrations with `alembic upgrade head`.
2. Add `NEXT_PUBLIC_WAY2SKILLS_API_URL=http://127.0.0.1:8000` to the existing
   frontend `.env.local` without replacing other variables.
3. Start the backend and frontend using the commands below.
4. Sign in at `/admin` using the initial admin created with the CLI.
5. Use **Courses** to add a course or programme. Set a unique lowercase slug,
   descriptions, category, type, duration, level, and
   delivery mode. Price and image URL are optional. Syllabus/outcomes and
   benefits are entered one item per line; curriculum keeps its line breaks.
   Expand the curriculum, benefits, and certificates sections to add their
   optional details.
6. Choose one of the four card themes or leave **Automatic rotation** selected.
   Explicit themes are preserved; otherwise public cards rotate deterministically
   through sky, mint, amber, and violet.
7. Publish the offering to make it available on the homepage, course/programme
   listings, details route, and applicable admission selector. Unpublished
   entries remain admin-only.
8. Use **Internships** to add an independent internship record, including its
   duration in months. Publish it to display it on the public Internship
   Opportunities page. Course creation does not create an internship or add one
   to any cart.
9. Course and internship details/cards can add their respective records to the
   shared browser-persisted cart. Course selections continue to the existing
   admission form; internships link to their published details or optional
   application URL. The cart does not calculate fees or treat stipend
   information as a charge.
10. Edit or unpublish any entry from the list. Course deletion requires confirmation and
   is blocked if an admission record references its slug.

For the frontend, use a separate PowerShell terminal:

```powershell
Set-Location 'C:\Users\user\OneDrive\Desktop\way2skills\frontend'
npm run dev
```

The dynamic details route is `/courses/{slug}` (including the existing
`/courses/full-stack-development` URL). Published course/programme options are
loaded into the admission form. The existing form submission payload and Apps
Script integration are unchanged.

## Security notes

- Login rate limiting is in-memory and per process (five failures per client IP
  per 60 seconds); use a shared gateway limiter before multi-worker deployment.
- CORS permits only the configured explicit origins.
- Authentication keys are environment-provided. Generate a unique key for each
  environment and keep it private.
- Admin APIs require a signed, expiring JWT and re-check that the admin account
  is active for every request.
- Database errors are returned without connection strings or internal
  exception details. The API does not log request bodies or credentials.
