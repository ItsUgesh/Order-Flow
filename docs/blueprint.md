# **App Name**: Cafe Compass

## Core Features:

- Secure Role-Based Authentication: Robust Firebase Email/Password authentication system for both Admin and Staff roles, with user roles stored and managed in Firestore. Includes initial auto-seeding of an admin user and comprehensive route protection.
- Interactive Point-of-Sale (POS) System: A staff-friendly, two-column POS interface featuring a dynamic menu grid with category filters, live cart updates, and quantity controls, designed for efficient order building.
- Flexible Order Management: Staff can 'Hold' orders to Firestore (including dine-in table selection or takeaway option) and 'Charge' them through a modal supporting Cash and Online payment methods. Held orders can be resumed for completion.
- Intuitive Menu Management (Admin): An administrative interface for adding, editing, and managing all menu items with properties such as name, category, price, and availability, utilizing a card-based layout and modal forms, persisted in Firestore.
- Smart Menu Item Description Tool (AI): An optional generative AI tool integrated into menu item creation and editing, which can suggest and create engaging, marketing-friendly descriptions for food items based on their name and category.
- Staff Account Administration (Admin): Admins can effortlessly add new staff accounts and manage existing ones, including deactivation, integrating Firebase Authentication with Firestore for user role and status tracking.
- Essential Business Insights (Admin Dashboard): A concise dashboard providing Admins with critical daily statistics such as total orders, total revenue, and on-hold order counts, along with a table of recent orders for quick overview.

## Style Guidelines:

- Overall Color Scheme: Dark, centered around professionalism and warmth.
- Background Color: Deep dark blue-grey for the sidebar and general application background, defined as '#0f172a'.
- Accent Color: Vibrant orange for buttons and highlights, defined as '#f97316'.
- Primary Color: A soft, neutral off-white ('#d9e2e6') providing clear readability and contrast against the dark background for main textual and interactive elements.
- Headline and Body Font: 'Inter' (sans-serif) for its clean, modern, and highly legible appearance. Note: currently only Google Fonts are supported.
- Icons: Utilise Lucide React for a consistent set of clean, scalable vector icons throughout the application.
- POS Screen: Features a clear two-column layout with a dynamic menu grid on the left and a live order cart on the right, ensuring optimal workflow for staff. Responsive design for tablet devices.
- Admin Panel: Incorporates a fixed left sidebar with distinct icons and labels for navigation, leading to a main content area structured with modern cards and tables.
- UI Components: Cards are styled with rounded-2xl corners, subtle shadows, and clean, subtly contrasting backgrounds for enhanced visual separation. Buttons feature a rounded pill style.
- Smooth Animations: Incorporate Framer Motion for elegant page transitions, modal animations, button hover effects, and loading spinners for a polished user experience.
- Toast Notifications: Styled notifications with distinct colors for success (green), error (red), and information (blue) messages to provide immediate feedback on user actions.