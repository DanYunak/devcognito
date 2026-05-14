# Devcognito

Backend API for an anonymous IT job board with authentication, vacancies, applications, and recruiter workflows.

## Live Demo (Render)

Render free tier blocks outbound SMTP. Emails are disabled in production. Use verification code `000000` for email verification flows.

## Local Docker Setup

1) Create environment file:

```bash
cp backend/.env.example backend/.env
```

2) Update `backend/.env` with your secrets (JWT, Cloudinary, SMTP). If you want real emails locally, keep `ENABLE_EMAILS=true`.

3) Build and run:

```bash
docker-compose up --build -d
```

Backend listens on `http://localhost:5000`.

## Environment Variables

Key variables (see `backend/.env.example` for full list):

- `ENABLE_EMAILS`: `true` to send real emails, `false` to mock emails and use code `000000`
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `CLOUDINARY_URL`: Cloudinary connection URL
- `SMTP_*`: SMTP settings used when `ENABLE_EMAILS=true`
