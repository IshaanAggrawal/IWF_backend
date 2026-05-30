# IWF Backend Service

An Express.js-based backend API service providing robust, scalable integrations for Razorpay payment processing and direct-to-cloud media uploads via Cloudinary.

---

## 🛠️ Technology Stack & Badges

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![Razorpay](https://img.shields.io/badge/Razorpay-02268A?style=for-the-badge&logo=razorpay&logoColor=white)
![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)
![Nodemon](https://img.shields.io/badge/Nodemon-76D04B?style=for-the-badge&logo=nodemon&logoColor=white)

---

## ✨ Features

- **Razorpay Payment Integration**: Create secure payment orders, capture transactions, and verify payment signatures on the backend.
- **In-Memory Cloudinary Uploads**: Bypasses local disk storage constraints by using Multer's `memoryStorage` and streaming file buffers directly to Cloudinary via `upload_stream`.
- **Pre-configured Postman Collection**: Importable API request templates for instant local environment testing.
- **Payment Simulator**: Local command-line tool to test Razorpay order generation and simulate successful payment verification signature generation.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18.x or higher recommended)
- **npm** (v9.x or higher)
- A **Razorpay** Account (for Test API keys)
- A **Cloudinary** Account (for cloud upload keys)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd IWF_backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the Environment Variables:
   Create a `.env` file in the root directory based on the `.env.example` template:
   ```bash
   cp env.example .env
   ```

4. Configure your `.env` keys:
   ```env
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret

   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```

---

## 💻 Running the App

### Development Mode (with Live Reload)
```bash
npm run dev
```
The server will start by default on `http://localhost:3000`.

### Production Mode
```bash
node app.js
```

---

## 📂 Project Structure

```text
├── src/
│   ├── config/            # Third-party service configurations (Razorpay, etc.)
│   ├── controllers/       # Route handlers and business logic
│   ├── middlewares/       # Multer (In-memory storage definition)
│   ├── routes/            # Express route groups (Payment, Upload)
│   ├── utils/             # Cloudinary upload stream helper functions
│   └── (jobs/sockets/...) # Extensible directories for jobs, sockets, models
├── scripts/
│   └── simulate-payment.js# Command-line utility to simulate Razorpay payment flow
├── .env.example           # Shared environment configurations structure
├── app.js                 # App entry point
├── IWF_backend.postman_collection.json # Exported Postman tests
└── package.json           # Scripts and dependencies
```

---

## 🔌 API Reference

### 💳 Payment Endpoints
All payments are handled under `/api/payment` namespace.

#### 1. Create Order
- **Endpoint**: `POST /api/payment/create-order`
- **Body Schema (`application/json`)**:
  ```json
  {
    "amount": 500,       // Amount in standard currency (e.g. 500 INR)
    "currency": "INR",   // Optional, default: "INR"
    "receipt": "rec_01", // Optional
    "notes": {}          // Optional metadata
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "order": {
      "id": "order_OdBZ9uGZ5uGZ5u",
      "entity": "order",
      "amount": 50000,   // Converted to subunits automatically
      "currency": "INR",
      ...
    }
  }
  ```

#### 2. Verify Payment
- **Endpoint**: `POST /api/payment/verify`
- **Body Schema (`application/json`)**:
  ```json
  {
    "razorpay_order_id": "order_OdBZ9uGZ5uGZ5u",
    "razorpay_payment_id": "pay_OdBZa1Z5uGZ5uG",
    "razorpay_signature": "signature_hash_here"
  }
  ```

---

### ☁️ File Upload Endpoint
All uploads are handled under `/api/upload` namespace.

#### 1. Upload File to Cloudinary
- **Endpoint**: `POST /api/upload`
- **Body Schema (`multipart/form-data`)**:
  - **Key**: `file` (Type: File)
- **Response**:
  ```json
  {
    "success": true,
    "message": "File uploaded successfully",
    "data": {
      "url": "http://res.cloudinary.com/...",
      "secure_url": "https://res.cloudinary.com/...",
      "public_id": "folder/sample_name"
    }
  }
  ```

---

## 🧪 Testing and Simulation

### Postman
You can import [IWF_backend.postman_collection.json](./IWF_backend.postman_collection.json) directly into Postman to quickly test all routes.

### Local CLI Payment Simulation
Test the Razorpay order creation and signature generation locally using:
```bash
node scripts/simulate-payment.js
```
This script will verify that your Razorpay keys are loaded and create a test order, outputting the generated signature matching Razorpay's hashing algorithm.
