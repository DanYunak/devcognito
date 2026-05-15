# Devcognito

**Анонімна платформа для пошуку роботи в ІТ**  
_Курсова робота з дисципліни «Проектування та розробка інформаційних систем»_  
**Автор: Юнак Д.О. • ПП-32 • Національний університет «Львівська політехніка»**

[![Live Demo](https://img.shields.io/badge/🚀_Демо-Render-46a2f1?style=flat-square)](https://devcognito-frontend.onrender.com/)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-20%2B-brightgreen?style=flat-square&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6%2B-4ea94b?style=flat-square&logo=mongodb)](https://www.mongodb.com/atlas)
[![Docker](https://img.shields.io/badge/Docker-✔-2496ed?style=flat-square&logo=docker)](https://www.docker.com/)

---

## 📖 Опис

**Devcognito** — веб-платформа для анонімного пошуку роботи в ІТ, яка поєднує кандидатів та рекрутерів без розкриття персональних даних до визначених етапів відбору. Реалізовано реєстрацію та email-верифікацію, анонімний перегляд кандидатів, підбір вакансій за релевантністю, чат між сторонами на етапах **Interview/Offer**, менеджмент вакансій і заявок, а також завантаження резюме.

---

## 🚀 Демо

**🌍 Публічний доступ:** [https://devcognito-frontend.onrender.com/](https://devcognito-frontend.onrender.com/)

> Render free tier блокує SMTP. Для верифікації email у демо використовуйте код `000000`.

---

## 🧰 Стек технологій

| Категорія | Інструменти |
|-----------|--------------|
| **Backend** | Node.js 20+, Express.js 4.19, Mongoose ODM |
| **Frontend** | React 18, Vite 5, Redux Toolkit, Tailwind CSS |
| **База даних** | MongoDB 6+ |
| **Авторизація** | JWT, bcryptjs, email verification |
| **Файли** | Cloudinary (загрузка резюме) |
| **Реальний час** | Socket.IO (чат) |
| **Тестування** | Jest |
| **Контейнеризація** | Docker, Docker Compose |

---

## 📁 Структура проєкту

Devcognito/
├── backend/ # API + бізнес-логіка
├── frontend/ # React-клієнт
├── docker-compose.yml # Локальний запуск сервісів
└── README.md

---

## 🔧 Встановлення та локальний запуск

### 📦 Через Docker (рекомендовано)

```bash
# 1. Клонуйте репозиторій
git clone <repo_url>
cd devcognito

# 2. Створіть .env файл для бекенда
cp backend/.env.example backend/.env

# 3. Запустіть сервіси
docker compose up --build -d

# 4. За потреби наповніть базу тестовими даними
docker compose run --rm backend pnpm run seed
```

Backend: `http://localhost:5001`  
Frontend: `http://localhost:5173`

### 🖥️ Локально без Docker

```bash
# Backend
cd backend
pnpm install
pnpm start

# Frontend
cd ../frontend
pnpm install
pnpm dev
```

---

## ⚙️ Змінні середовища (backend/.env)

Основні змінні (повний список у `backend/.env.example`):

- `MONGO_URI` — підключення до MongoDB
- `JWT_SECRET` — секрет для підпису токенів
- `JWT_EXPIRES_IN` — термін дії токена (наприклад `7d`)
- `CLOUDINARY_URL` — доступ до Cloudinary
- `APP_BASE_URL` — URL фронтенда для email-посилань
- `ENABLE_EMAILS` — `true/false` для реальних листів
- `SMTP_*` — налаштування SMTP, коли `ENABLE_EMAILS=true`

---

## 🌐 API Endpoints (основні)

### 🔐 Авторизація
- `POST /api/auth/register` — реєстрація (role: candidate/recruiter/admin)
- `POST /api/auth/verify-email` — підтвердження email
- `POST /api/auth/resend-verification` — повторне надсилання коду
- `POST /api/auth/login` — вхід
- `GET /api/auth/me` — поточний користувач
- `PATCH /api/auth/me` — оновлення профілю
- `POST /api/auth/me/resume` — завантажити резюме (candidate)

### 💼 Вакансії
- `GET /api/vacancies` — публічні вакансії (фільтри, пагінація)
- `GET /api/vacancies/matched` — вакансії з match-скорингом (candidate)
- `GET /api/vacancies/mine` — вакансії рекрутера
- `POST /api/vacancies` — створити вакансію (recruiter/admin)
- `PATCH /api/vacancies/:vacancyId` — оновити вакансію
- `PATCH /api/vacancies/:vacancyId/status` — змінити статус
- `DELETE /api/vacancies/:vacancyId` — видалити (soft delete)
- `GET /api/vacancies/:vacancyId/candidates` — кандидати на вакансію

### 📄 Заявки
- `POST /api/applications` — подати заявку (candidate)
- `GET /api/applications/me` — мої заявки
- `GET /api/applications/board` — канбан-борд рекрутера
- `GET /api/applications/vacancy/:vacancyId` — заявки по вакансії
- `PATCH /api/applications/:applicationId/status` — змінити статус
- `DELETE /api/applications/:applicationId` — відкликати заявку

### 🔖 Закладки
- `GET /api/bookmarks` — мої закладки (candidate)
- `POST /api/bookmarks` — додати закладку
- `DELETE /api/bookmarks/:vacancyId` — видалити закладку

### 💬 Чат (Socket.IO)
- `GET /api/chat/:applicationId/messages` — історія повідомлень

---

## 🗃️ Моделі MongoDB (Mongoose)

- `users` — кандидати/рекрутери/адміни
- `companies` — компанії рекрутерів
- `vacancies` — вакансії
- `applications` — заявки
- `bookmarks` — закладки вакансій
- `messages` — повідомлення чату

---

## 🧪 Тестування

```bash
cd backend
pnpm test

cd ../frontend
pnpm test
```

---

## 📧 Email-сповіщення

Підтвердження email, повторна відправка коду та статуси заявок.  
У продакшені Render SMTP вимкнено — використовуйте код `000000`.

---

---

## 📝 Ліцензія

Цей проєкт створено виключно в навчальних цілях.
© 2026 Юнак Д.О., Національний університет «Львівська політехніка».
