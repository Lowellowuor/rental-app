<div align="center">

# Rental App

**Property management platform built for the Kenyan rental market**

Manage estates, houses, rooms, tenants, leases, invoices, M-Pesa payments, and maintenance — all from one place.

[![Django](https://img.shields.io/badge/Django-5.2-092E20?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![DRF](https://img.shields.io/badge/DRF-3.15-A30000?logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Celery](https://img.shields.io/badge/Celery-5-37814A?logo=celery&logoColor=white)](https://docs.celeryq.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

</div>

---

## Table of contents

- [Overview](#overview)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [Roles & permissions](#roles--permissions)
- [API reference](#api-reference)
- [M-Pesa integration](#m-pesa-integration)
- [Background tasks](#background-tasks)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

**Rental App** is a full-stack property management system designed for landlords, estate managers, caretakers, and tenants in Kenya. It replaces spreadsheets and WhatsApp threads with a single platform for the entire rental lifecycle — from onboarding a tenant to reconciling M-Pesa payments.

The backend is a Django REST API with JWT auth, role-based permissions, and native M-Pesa (Safaricom Daraja) integration. The frontend is a mobile-first React SPA with role-aware navigation, offline-friendly design, and a warm, professional interface.

---

## Features

### Property management
- Multi-estate portfolio management
- Hierarchical structure: Estate → House → Room
- Occupancy tracking with auto-sync on lease creation/termination
- Assign landlords, estate managers, and caretakers per estate

### Leasing
- Full lease lifecycle: pending → active → expired → terminated
- Configurable rent due day, late-fee percentage, deposit
- Auto-generated monthly invoices
- Partial payments with balance tracking
- Idempotent invoice generation (no duplicates per period)

### Payments
- M-Pesa STK push integration (Daraja API)
- Automatic payment reconciliation via callbacks
- Idempotent callback handling (safe against Safaricom retries)
- Partial payment support with balance recalculation
- Live payment status polling in the frontend

### Maintenance
- Category-based ticketing (plumbing, electrical, pest, security, etc.)
- Priority levels: low → medium → high → urgent
- Assignment to caretakers / estate managers
- Timestamped activity log
- Staff-only status transitions

### Admin & reporting
- Django admin for all models
- Role-scoped API responses
- Arrears dashboard with aging buckets (0–30, 31–60, 60+ days)
- Outstanding balance summaries per tenant / estate

### Security
- JWT authentication with refresh-token rotation
- Token blacklist on logout
- Role-based object-level permissions
- Rate limiting per endpoint (login, register, payments, estate creation)
- HTTPS-ready settings (HSTS, secure cookies, SSL redirect)
- Environment-driven secrets (no hardcoded credentials)

---

## Tech stack

### Backend

| Layer | Technology |
|---|---|
| Framework | Django 5.2 |
| API | Django REST Framework 3.15 |
| Auth | `djangorestframework-simplejwt` |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Task queue | Celery 5 + Redis |
| Payments | Safaricom M-Pesa Daraja API |
| Filtering | `django-filter` |
| CORS | `django-cors-headers` |
| Config | `python-dotenv` |

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Build tool | Vite 8 |
| Router | React Router v6 |
| Styling | Tailwind CSS 4 |
| HTTP | Axios |
| Icons | Inline SVG |

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        Frontend                           │
│   React 18 + Vite + Tailwind + React Router + Axios       │
│                                                            │
│  ┌────────────┐   ┌─────────────┐   ┌──────────────────┐ │
│  │ features/  │   │ components/ │   │       api/        │ │
│  │  auth      │   │  ui         │   │  client.js        │ │
│  │  dashboard │   │  layout     │   │  (JWT refresh)     │ │
│  │  properties│   │  feedback   │   │                    │ │
│  │  leasing   │   │             │   │                    │ │
│  │  payments  │   │             │   │                    │ │
│  │  mainten.  │   │             │   │                    │ │
│  └────────────┘   └─────────────┘   └──────────────────┘ │
└──────────────────────────┬─────────────────────────────────┘
                            │ HTTPS / JWT
                            ▼
┌──────────────────────────────────────────────────────────┐
│                     Django REST API                        │
│                                                            │
│  /api/v1/auth/          users · JWT · profiles            │
│  /api/v1/properties/    estates · houses · rooms          │
│  /api/v1/leasing/       leases · invoices                 │
│  /api/v1/payments/      M-Pesa transactions                │
│  /api/v1/maintenance/   tickets                            │
│  /api/mpesa/callback/   Safaricom webhook                  │
│                                                            │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────┐   │
│  │ Postgres │  │  Redis   │  │  Celery   │  │ M-Pesa │   │
│  │          │  │ (broker) │  │  workers  │  │ Daraja │   │
│  └──────────┘  └──────────┘  └───────────┘  └────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Project structure

```
rental_app/
├── backend/
│   ├── config/                # Django project settings + URLs
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── celery.py
│   │   └── wsgi.py
│   ├── core/                  # Shared utilities (exception handler)
│   ├── users/                 # Custom user model + auth
│   ├── properties/            # Estates, houses, rooms
│   ├── leasing/                # Leases + invoices
│   ├── payments/              # M-Pesa integration
│   ├── maintenance/           # Maintenance tickets
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/                # Axios client + endpoint modules
│   │   ├── app/                # App-level wiring
│   │   ├── components/         # Shared UI
│   │   │   ├── ui/             # Button, Modal, Card, etc.
│   │   │   ├── layout/         # AppLayout, top bar, sidebar
│   │   │   └── feedback/       # Toasts, errors
│   │   ├── features/           # Domain-specific code
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── properties/
│   │   │   ├── leasing/
│   │   │   ├── payments/
│   │   │   ├── maintenance/
│   │   │   └── tenants/
│   │   ├── lib/                # Utilities (cn, formatting)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## Getting started

### Prerequisites

- **Python** 3.11+
- **Node.js** 18+ and npm
- **Redis** (for Celery — optional in dev)
- **ngrok** or similar (for M-Pesa callbacks in dev)

### Clone the repository

```bash
git clone https://github.com/Lowellowuor/rental-app.git
cd rental-app
```

---

## Environment variables

### Backend

Copy the example file:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
# Django
DJANGO_SECRET_KEY=your-50-char-random-string
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
DJANGO_TIME_ZONE=Africa/Nairobi

# CORS
CORS_ALLOW_ALL_ORIGINS=True
CORS_ALLOWED_ORIGINS=http://localhost:5173
CSRF_TRUSTED_ORIGINS=http://localhost:5173

# Database (SQLite for dev, Postgres for prod)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# M-Pesa (Safaricom Daraja)
MPESA_ENV=sandbox
MPESA_CONSUMER_KEY=your_key
MPESA_CONSUMER_SECRET=your_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://your-ngrok-url.ngrok.io/api/mpesa/callback/

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

Generate a strong `DJANGO_SECRET_KEY`:

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### Frontend

Create `frontend/.env` if you need a custom API URL:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

Leave blank to use the Vite dev proxy (`/api` → `http://127.0.0.1:8000`).

---

## Running the app

### Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

- API: `http://127.0.0.1:8000/api/v1/`
- Admin: `http://127.0.0.1:8000/admin/`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

### Celery (optional, for background tasks)

In separate terminals:

```bash
# Worker
celery -A config worker -l info

# Beat (scheduler)
celery -A config beat -l info
```

---

## Roles & permissions

| Role | Capabilities |
|---|---|
| `ADMIN` | Full platform access |
| `LANDLORD` | Owns estates, views income, assigns managers |
| `ESTATE_MANAGER` | Manages assigned estates, houses, rooms, tenants, invoices |
| `CARETAKER` | Handles assigned maintenance tickets |
| `AGENT` | Lists properties, schedules viewings |
| `ACCOUNTANT` | Read-only finance access, arrears reporting |
| `TENANT` | Views own invoices, pays rent, reports issues |
| `SUB_TENANT` | Same as tenant, scoped to a single room |

### Permission matrix

| Action | ADMIN | LANDLORD | MANAGER | CARETAKER | TENANT |
|---|:---:|:---:|:---:|:---:|:---:|
| Create estate | ✅ | ✅ | ✅ | — | — |
| Manage houses / rooms | ✅ | ✅ | ✅ | — | — |
| Create lease | ✅ | ✅ | ✅ | — | — |
| Generate invoice | ✅ | ✅ | ✅ | — | — |
| Mark invoice paid | ✅ | ✅ | ✅ | — | — |
| Pay invoice (M-Pesa) | — | — | — | — | ✅ |
| View own invoices | — | — | — | — | ✅ |
| Report maintenance | ✅ | ✅ | ✅ | ✅ | ✅ |
| Resolve ticket | ✅ | ✅ | ✅ | ✅ | — |
| View arrears | ✅ | ✅ | ✅ | — | — |

---

## API reference

Base URL: `/api/v1/`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register/` | Register new user |
| `POST` | `/auth/login/` | Obtain access + refresh tokens |
| `POST` | `/auth/refresh/` | Refresh access token |
| `POST` | `/auth/logout/` | Blacklist refresh token |
| `GET` | `/auth/profile/` | Current user profile |
| `PATCH` | `/auth/profile/` | Update profile |
| `GET` | `/auth/list/` | List users (filterable) |
| `GET` | `/auth/managers/` | List estate managers |

### Properties

| Method | Endpoint | Description |
|---|---|---|
| `GET` `POST` | `/properties/estates/` | List / create estates |
| `GET` `PATCH` `DELETE` | `/properties/estates/{id}/` | Retrieve / update / delete |
| `GET` `POST` | `/properties/houses/` | List / create houses |
| `GET` `PATCH` `DELETE` | `/properties/houses/{id}/` | Retrieve / update / delete |
| `GET` `POST` | `/properties/rooms/` | List / create rooms |
| `GET` `PATCH` `DELETE` | `/properties/rooms/{id}/` | Retrieve / update / delete |

### Leasing

| Method | Endpoint | Description |
|---|---|---|
| `GET` `POST` | `/leasing/leases/` | List / create leases |
| `POST` | `/leasing/leases/{id}/generate-invoice/` | Manually generate next invoice |
| `POST` | `/leasing/leases/{id}/terminate/` | Terminate a lease |
| `GET` | `/leasing/invoices/` | List invoices |
| `POST` | `/leasing/invoices/{id}/mark-paid/` | Mark invoice as paid |
| `POST` | `/leasing/invoices/{id}/apply-late-fee/` | Apply late fee |
| `POST` | `/leasing/invoices/{id}/cancel/` | Cancel invoice |

### Payments

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/payments/transactions/` | List M-Pesa transactions |
| `POST` | `/payments/transactions/initiate/` | Initiate STK push |
| `GET` | `/payments/transactions/{id}/status/` | Poll transaction status |
| `POST` | `/api/mpesa/callback/` | Safaricom webhook (unauthenticated) |

### Maintenance

| Method | Endpoint | Description |
|---|---|---|
| `GET` `POST` | `/maintenance/tickets/` | List / create tickets |
| `GET` `PATCH` | `/maintenance/tickets/{id}/` | Retrieve / update |
| `PATCH` | `/maintenance/tickets/{id}/status/` | Update status (staff only) |
| `POST` | `/maintenance/tickets/{id}/notes/` | Append activity note |
| `POST` | `/maintenance/tickets/{id}/assign/` | Assign to staff |
| `POST` | `/maintenance/tickets/{id}/cancel/` | Cancel ticket |

---

## M-Pesa integration

The platform integrates with Safaricom's Daraja API for STK push payments.

### Flow

```
1. Tenant selects invoice   → POST /payments/transactions/initiate/
2. Backend calls Daraja      → STK push sent to tenant's phone
3. Tenant enters PIN         → Safaricom processes payment
4. Safaricom calls webhook   → POST /api/mpesa/callback/
5. Backend updates transaction → Invoice balance recalculated
6. Frontend polls status     → GET /payments/transactions/{id}/status/
```

### Sandbox setup

1. Create an account at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Create an app and get a Consumer Key + Consumer Secret
3. Use the sandbox shortcode `174379` and its passkey
4. Expose your local server: `ngrok http 8000`
5. Set `MPESA_CALLBACK_URL` to your ngrok URL + `/api/mpesa/callback/`

### Production setup

1. Set `MPESA_ENV=production`
2. Use your live shortcode and passkey
3. Ensure the callback URL is publicly reachable over HTTPS
4. Register the callback URL in the Daraja portal

### Idempotency

Safaricom retries callbacks on non-200 responses. The webhook:

- Always returns `{"ResultCode": 0}` to prevent retry storms
- Uses `select_for_update()` to serialize concurrent callbacks
- Skips already-finalized transactions (success/failed)
- Logs every callback for dispute resolution

---

## Background tasks

Scheduled via Celery Beat:

| Task | Schedule | Purpose |
|---|---|---|
| `leasing.tasks.generate_daily_invoices` | Daily 00:00 | Generate monthly invoices |
| `payments.tasks.cleanup_stale_transactions` | Every 6 hours | Fail stuck processing transactions |

---

## Testing

### Backend

```bash
cd backend
python manage.py test
```

Or with pytest:

```bash
pytest --cov=. --cov-report=html
```

### Frontend

```bash
cd frontend
npm run test
```

---

## Deployment

### Backend (example: Render / Railway / Fly.io)

1. Set all environment variables from `.env.example`
2. Set `DJANGO_DEBUG=False`
3. Set `DJANGO_ALLOWED_HOSTS=yourdomain.com`
4. Set `CORS_ALLOWED_ORIGINS=https://yourfrontend.com`
5. Run migrations: `python manage.py migrate`
6. Collect static files: `python manage.py collectstatic --no-input`
7. Serve with Gunicorn: `gunicorn config.wsgi:application`
8. Run Celery worker + beat as separate processes

### Frontend (example: Vercel / Netlify)

- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL=https://api.yourdomain.com/api/v1`

### Production checklist

- [ ] `DEBUG=False`
- [ ] Strong `DJANGO_SECRET_KEY` (50+ chars)
- [ ] `ALLOWED_HOSTS` restricted
- [ ] HTTPS enforced (`SECURE_SSL_REDIRECT=True`)
- [ ] Database backups scheduled
- [ ] Redis persistence enabled
- [ ] Log aggregation (Sentry, Datadog, etc.)
- [ ] M-Pesa callback URL registered in Daraja portal

---

## Contributing

Contributions are welcome. Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Follow the existing code style (no comments, descriptive names)
4. Write or update tests
5. Ensure `python manage.py check` and `npm run build` pass
6. Commit with clear messages: `feat: add tenant filter to lease list`
7. Push and open a Pull Request

### Commit convention

```
feat:     new feature
fix:      bug fix
docs:     documentation
style:    formatting, no code change
refactor: code restructure
test:     test additions
chore:    build / tooling
```

---

## License

Distributed under the MIT License. See [LICENSE](./LICENSE) for details.

---

## Contact

**Lowell Owuor**
GitHub: [@Lowellowuor](https://github.com/Lowellowuor)
Repository: [rental-app](https://github.com/Lowellowuor/rental-app)

<div align="center">

Built for the Kenyan rental market 🇰🇪

</div>
