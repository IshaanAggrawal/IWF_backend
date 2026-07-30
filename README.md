# IWF Backend — Frontend Integration

## Run locally

```bash
cd backend
docker compose up -d
cp .env.example .env   # fill Razorpay test + Cloudinary when ready
npm install
npm run seed
npm run dev            # http://localhost:5000
```

## Postman

1. Import [`postman/IWF_Backend_API.postman_collection.json`](postman/IWF_Backend_API.postman_collection.json)
2. Import [`postman/IWF_Local.postman_environment.json`](postman/IWF_Local.postman_environment.json)
3. Select **IWF Local** environment
4. Run **Auth → Login** (saves `adminToken` automatically)

Default admin (from seed): `admin@iwf.org` / `admin123456`  
Dev membership OTP: `1234`

## Cards — two separate systems

| System | Cards | Stored on | Thresholds / fees |
|--------|-------|-----------|-------------------|
| **Donor recognition** | Silver / Gold / Platinum | `DonationTransaction.donorCardTier` + `Donor.tier` | `GET /api/donations/tiers` or `/api/cms/donor-tiers` |
| **Membership** | Blue / Yellow / Green | `MembershipApplication.category` + `categorySnapshot` + `Member` | `GET /api/cms/membership-categories` |

### What a donation stores
- Full form snapshot (`formSnapshot`): donor type, citizenship, name, email, phone, address, PAN, tax exemption, consent, financial type, amount, payment mode, patient slug
- Payment details (`paymentDetails`): channel (upi/card/netbanking), UPI id, bank UTR, cheque fields
- Razorpay ids when online
- `donorCardTier` for **this gift** (e.g. ₹10,000 → Gold card)
- On success: bumps `Donor.totalDonated` and lifetime `Donor.tier`

### What a membership application stores
- All form fields + chosen **Blue/Yellow/Green** card
- `categorySnapshot` (code, fee, features, color at apply time)
- Payment mode + payment details + Razorpay ids
- Photo / ID proof URLs (Cloudinary or local)

## Media (Cloudinary)

Set in `.env`:

```
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CLOUDINARY_FOLDER=iwf
```

Without credentials, uploads go to `backend/uploads` and are served at `/uploads/...`.

## Frontend

API-only for now — no frontend wiring. Integrate later using Postman as the contract.
