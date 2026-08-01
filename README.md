# IWF Backend — Frontend Integration Guide

Welcome to the **Islah Welfare Foundation (IWF)** Backend Repository! 
This backend is built on a **Modular Microservice Architecture** (Monolithic deployment) using **Node.js, Express, and MongoDB**.

This document is specifically designed for the **Frontend Development Team** to easily understand how to run the server, integrate APIs, and handle authentication and payments.

---

## 🚀 1. How to Run the Backend (Locally)

To test your frontend integrations, you must run this backend server on your local machine.

### Prerequisites
1. Install **Node.js** (v18+)
2. Install **Docker Desktop** (For running the local MongoDB database)

### Startup Commands

Open a terminal in the `backend/` directory and run:

```bash
# 1. Start MongoDB in the background via Docker
docker compose up -d

# 2. Install all dependencies
npm install

# 3. Create your local environment file
cp .env.example .env

# 4. Start the Development Server
npm run dev
```

The API Gateway will now be running at: **`http://localhost:5000`**

---

## 🔑 2. Required API Keys (.env)

When you run `cp .env.example .env`, the server will work out of the box for most things (it uses fallback test ports and dummy keys). However, for specific functionality, you need the following keys:

| Service | Environment Variable | What is it for? |
|---------|----------------------|-----------------|
| **Razorpay** | `RAZORPAY_KEY_ID`<br/>`RAZORPAY_KEY_SECRET` | Required to test the actual Donation/Payment processing. Generate these from the [Razorpay Dashboard (Test Mode)](https://dashboard.razorpay.com). |
| **Emails** | `SMTP_HOST`<br/>`SMTP_PORT`<br/>`SMTP_USER`<br/>`SMTP_PASS` | Required for sending automated PDF donation receipts. You can use a free test account like [Ethereal Email](https://ethereal.email/) for local development. |
| **Auth** | `JWT_SECRET` | Required for generating Admin authentication tokens. (A random string like `super_secret_key` is fine for local dev). |
| **Cloudinary** (Optional) | `CLOUDINARY_CLOUD_NAME`<br/>`CLOUDINARY_API_KEY`<br/>`CLOUDINARY_API_SECRET` | If left blank, images are saved locally to `/uploads`. If filled, images upload directly to Cloudinary. |

---

## 🧪 3. Postman API Collection (The Holy Grail)

We have provided a complete Postman collection that documents every single route, header, and body payload required to make the backend work.

1. **Locate the file:** Find `IWF_Backend_Postman_Collection.json` in the root of the `backend/` folder.
2. **Import to Postman:** Open Postman -> Click `Import` -> Drag and drop the file.
3. **Usage:** The collection contains ready-to-fire requests for:
   - Creating Donations
   - Verifying Razorpay Signatures
   - Submitting Contact Forms
   - Fetching dynamic CMS data (News, Patients, Ticker Notices, Stats)

**Important Rule for Frontend:** Do not write random Axios calls! Always test the endpoint in Postman first, observe the exact JSON structure it expects, and then implement it in React.

---

## 🔌 4. Core API Architectures & Handoff Info

All routes are prefixed with `/api`. Here is how they are broken down:

### A. Payments & Donations (`/api/donations`)
- **Initialization:** Frontend calls `POST /api/donations/init` with donor details. The backend returns a Razorpay `orderId`.
- **Checkout:** Frontend opens the Razorpay popup using this `orderId`.
- **Verification (CRITICAL):** Upon success, Razorpay gives the frontend a `signature`. The frontend MUST call `POST /api/donations/verify` and pass this signature to the backend. **The donation is NOT recorded until this verify endpoint is called.**

### B. Communication (`/api/contact`)
- Both the **Contact Page Form** and the **Footer Newsletter Subscription** hit this microservice.
- *Note:* These routes are strictly rate-limited to prevent spam. If you get a `429 Too Many Requests` during testing, it means the rate limiter caught you.

### C. CMS / Dynamic Content (`/api/cms`)
- The backend serves dynamic content for the frontend to render.
- **Public Routes:** `GET /api/cms/notices` (for the scrolling ticker), `GET /api/cms/settings` (for the homepage stats), `GET /api/cms/patients` (for urgent campaigns).
- **Protected Routes (`POST`, `PUT`):** These require an `Authorization: Bearer <token>` header. In production, this will be handled by the Admin Dashboard.

---

## 🏁 How to "Win" at Integration

To successfully integrate this backend into the React frontend, follow this strategy:
1. **Mock Nothing:** Delete any `setTimeout` or hardcoded mock data in the React components.
2. **Postman Driven Development:** Look at the Postman collection, copy the exact JSON response, and build your React Zod schemas/TypeScript interfaces around it.
3. **Use React Query (Tanstack):** Wrap the Axios calls in `useQuery` or `useMutation` to handle loading and error states gracefully. 
4. **Global Error Handling:** The backend returns errors in a standard `{ error: "Message here" }` format. Catch these globally and display them using a toast notification system (like `sonner`).

Happy Coding! 🚀
