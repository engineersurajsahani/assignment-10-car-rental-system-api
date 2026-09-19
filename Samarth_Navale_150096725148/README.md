# 🚗 Car Rental & Fleet Management REST API (Assignment 10)

🚀 **Live Deployment Links:**
- **Render:** [https://samarth-assignment-10-car-rental-api.onrender.com](https://samarth-assignment-10-car-rental-api.onrender.com)
- **Vercel:** [https://samarth-assignment-10-car-rental-ap.vercel.app](https://samarth-assignment-10-car-rental-ap.vercel.app)

---

- **Name:** Samarth Navale
- **Roll No:** 150096725148
- **Cohort:** Sam Altman

---

A production-ready **Car Rental & Vehicle Fleet Management API** utilizing **Supabase** (PostgreSQL & Auth). Features date-range collision prevention algorithms, automated day span cost calculation, vehicle fleet management, and secure JWT authentication.

---

## 🚀 Features

- 🔐 **Authentication & Customer Accounts**: Secure JWT token generation and authentication.
- 🚗 **Fleet & Vehicle Management**: Vehicle CRUD with category and availability status filtering.
- 📅 **Date Range Collision Prevention**: Prevents double-booking overlapping reservations on the same vehicle.
- 💰 **Automated Billing & Cost Calculation**: Computes total billing amount based on reservation day spans.
- 📊 **Swagger API Documentation**: OpenAPI 3.0 specification available at `/api-docs`.
- 📮 **Postman Collection Included**: Complete collection with token variables and conflict test cases.

---

## 🛠️ Tech Stack & Dependencies

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database / Auth:** Supabase / PostgreSQL & JWT
- **Documentation:** Swagger UI Express & OpenAPI 3.0
- **Testing:** Supertest

---

## ⚙️ Environment Variables

```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
JWT_SECRET=supersecretkey123
```

---

## 🧪 Testing

```bash
npm install
npm test
```
