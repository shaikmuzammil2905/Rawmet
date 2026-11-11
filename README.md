# RAWMET.com — Online Real-time Business Portal

Multi-vendor B2B industrial business marketplace and real-time trade portal operated by **Sriñidhi Enterprises**.

## Core Capabilities

- **Responsive Multi-Device Experience**: Desktop, tablet, and dedicated mobile navigation (sticky mobile bottom bar + hamburger drawer) with separate desktop and mobile hero imagery.
- **Products Marketplace**: Rubber, Plastic, Metals, and Bio Petro Chemical with search, category/subcategory filters, location filtering, sorting, and pagination.
- **Machineries & Turnkey Plants**: Rubber Machineries, Plastic Machineries, Metals – Plants, BPC – Plants, and Vehicle – Fabrication – Bodybuilders.
- **Industrial & Business Services**: Manpower, AMC, Maintenance, Mechanical, Logistics, Loans, Business Registrations, and Website / App Services.
- **Real-Time Business Opportunities**: Search active buyer requirements, post requirements with attachment upload, and automatically notify eligible GST-verified opted-in vendors via WhatsApp alerts.
- **Vendor Registration & Free Listings**: GST / Authentic ID verification workflow (`pending` → `approved` / `rejected` / `suspended`) with full vendor dashboard for listing management, enquiries, and WhatsApp notification controls.
- **Customer Portal & Mobile OTP Auth**: Mobile OTP login, password login, registration, saved listings, requirements, enquiries, payment history, and printable GST tax invoices.
- **Subscription Plans & Server-Verified Payment Gateway**:
  - 6 Months: ₹6,000 (incl. 18% GST)
  - 12 Months: ₹11,000 (incl. 18% GST)
  - 2 Years: ₹20,000 (incl. 18% GST)
  - 3 Years: ₹35,000 (incl. 18% GST) + **4th Year FREE Offer**
  - Backend HMAC-SHA256 signature verification, duplicate payment protection, and failure/pending/cancelled handling.
- **Admin Panel & Dynamic CMS (`/admin`)**: Manage vendors, users, products, machineries, services, categories, subcategories, requirements, enquiries, subscriptions, payments, offers, gallery, About Us, hero banners, WhatsApp alerts, referrals, and portal settings.

## Local Setup

1. Copy `.env.example` to `.env.local` and configure secrets.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```
4. Build and run production server:
   ```bash
   npm run build
   npm start
   ```

> Database: Uses `node-sqlite3-wasm` (WebAssembly SQLite, compatible with Node 20/22/24 and Vercel Serverless) persisted at `data/rawmet.db` locally or `/tmp/rawmet-data/rawmet.db` in serverless environments, and automatically seeded on first launch.

