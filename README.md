# OrderFlow — Restaurant Management System

A full-featured Restaurant Management System (RMS) built for cafe and restaurant operations. Manages orders, menu, staff, and daily sales reporting with a built-in POS terminal.

---

## Features

### POS Terminal
- Take dine-in and takeaway orders
- Assign table numbers (1–unlimited) for dine-in orders
- Hold orders and resume them later
- Merge new items into existing on-hold orders by table number
- Charge orders via Cash or Online payment
- Print 88mm thermal receipts after payment

### Admin Panel
- **Dashboard** — daily order count, revenue, on-hold orders, menu item count, recent orders
- **Menu Management** — add, edit, delete menu items with dynamic categories
- **Category Management** — create and delete categories that instantly reflect on the POS
- **Order History** — filter by status and date (Today / This Week / This Month) with pagination
- **Sales Report** — daily summary with PDF export
- **Staff Management** — create and deactivate staff accounts

### Authentication & Roles
- Firebase Email/Password authentication
- Two roles: **Admin** and **Staff/Cashier**
- Admins access the full admin panel and POS
- Staff access the POS only
- Inactive accounts are blocked from login

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Icons | Lucide React |
| Notifications | React Hot Toast |
| PDF Export | jsPDF + jspdf-autotable |

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/ItsUgesh/Order-Flow.git
cd Order-Flow
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Run the development server
```bash
npm run dev
```

### 5. Demo credentials

```
Email:    admin@orderflow.com
Password: admin123
```

---

## Firestore Data Structure

```
users/{uid}
  name, email, role ("admin" | "staff"), createdAt, inactive (bool)

menuItems/{id}
  name, category, price, available (bool), createdAt

categories/{id}
  name, createdAt

orders/{id}
  orderNumber, type ("dine_in" | "takeaway"),
  tableNumber, items[], subtotal, total,
  status ("on_hold" | "paid"),
  paymentMethod ("cash" | "online" | null),
  createdBy, createdAt, paidAt
```

---

## Deployment

Deployed on **Vercel** with **Firebase** as the backend.

---

## License

Private project — all rights reserved.yeah