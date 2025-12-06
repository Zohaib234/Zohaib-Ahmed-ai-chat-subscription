# AI Chat Subscription API

A clean architecture (DDD-style) REST API for AI chat with subscription-based quota management.

## Features

### Module 1: AI Chat
- Accept user questions and return mocked OpenAI responses
- Store question, answer, and tokens in database
- Track monthly usage per user:
  - 3 free messages per month (auto-reset on 1st of month)
  - After free quota, requires valid subscription
- Support multiple subscription tiers:
  - Basic (10 responses)
  - Pro (100 responses)
  - Enterprise (unlimited)
- Simulate OpenAI API response time delay

### Module 2: Subscription Bundles
- Create subscriptions with tiers (Basic/Pro/Enterprise)
- Billing cycles: monthly or yearly (20% discount)
- Toggle auto-renew
- Simulated billing with random payment failures
- Subscription cancellation (preserves usage history)

## Architecture

```
src/
├── apps/
│   └── api-service/
│       ├── application.ts      # Entry point
│       ├── config.ts           # Configuration
│       └── lib/
│           ├── dtos/           # Request validation
│           ├── mappers/        # Response transformation
│           ├── middlewares/    # Auth middleware
│           ├── routes/         # Controllers
│           │   ├── auth/
│           │   ├── chat/
│           │   ├── health/
│           │   └── subscriptions/
│           └── service.ts      # Main service
└── packages/
    ├── clients/
    │   ├── openai.ts           # Mocked OpenAI client
    │   └── postgres.ts         # PostgreSQL client
    ├── domains/
    │   ├── chat-message.ts     # Chat entity
    │   ├── subscription.ts     # Subscription entity
    │   └── user.ts             # User entity
    ├── repositories/
    │   ├── chat-message.ts
    │   ├── subscription.ts
    │   └── user.ts
    ├── use-cases/
    │   ├── authenticate-user.ts
    │   ├── cancel-subscription.ts
    │   ├── create-subscription.ts
    │   ├── process-subscription-renewals.ts
    │   ├── register-user.ts
    │   └── send-message.ts
    └── utils/
        ├── ajv-error-resolver.ts
        ├── exception.ts
        └── logger.ts
```

## API Endpoints

### Auth
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login and get JWT token

### Chat
- `POST /v1/chat/send` - Send message (protected)
- `GET /v1/chat/history` - Get chat history (protected)

### Subscriptions
- `POST /v1/subscriptions` - Create subscription (protected)
- `GET /v1/subscriptions` - List subscriptions (protected)
- `POST /v1/subscriptions/:id/cancel` - Cancel subscription (protected)

### Health
- `GET /v1/health` - Health check

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Start PostgreSQL and create database:
```sql
CREATE DATABASE ai_chat_subscription;
```

4. Run development server:
```bash
npm run dev
```

## Scripts

- `npm run build` - Build TypeScript
- `npm run start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier

## Subscription Pricing

| Tier | Messages | Monthly Price | Yearly Price |
|------|----------|---------------|--------------|
| Basic | 10 | $9.99 | $95.90 (20% off) |
| Pro | 100 | $29.99 | $287.90 (20% off) |
| Enterprise | Unlimited | $99.99 | $959.90 (20% off) |

## Error Handling

Structured errors with proper HTTP status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Validation Error
- `429` - Quota Exceeded
- `500` - Internal Server Error

## Technologies

- Node.js + TypeScript
- Express.js
- PostgreSQL (pg)
- JWT Authentication
- AJV Validation
- ESLint + Prettier
