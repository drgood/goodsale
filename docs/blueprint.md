# **App Name**: Vendora SaaS MVP

## Core Features:

- Multi-Tenant System: Implement multi-tenancy using stancl/tenancy for shop separation with subdomain routing.
- Authentication & Roles: Implement Sanctum-based authentication with roles (Owner, Manager, Cashier) and role-based route guards.
- Product & Inventory Management: Enable CRUD operations for products, auto-update stock levels, and provide low-stock alerts. Include bulk import/export via CSV.
- Point of Sale (POS): Develop a POS screen for searchable products, cart management, discounts/taxes, and payment method selection. Generate printable receipts.
- Sales & Reports: Record transactions, provide a dashboard with key metrics (total sales, top products), and enable filtering/exporting reports.
- SaaS Admin Panel: Create a super admin panel to manage tenants, view usage, and manage subscription plans.
- Settings & Branding: Allow tenants to configure shop name, logo, receipt header/footer, tax & currency, and POS settings.

## Style Guidelines:

- Primary color: Deep Blue (#1A237E) to convey trust, security, and stability suitable for SaaS applications.
- Background color: Light Blue Gray (#E8EAF6) - Provides a clean and unobtrusive backdrop that allows the primary color and content to stand out. Chosen to work well in either a light or dark UI theme.
- Accent color: Bright Green (#4CAF50) for actionable elements (buttons, links) and success indicators. Provides an optimistic and reassuring signal in a POS context.
- Font pairing: 'Space Grotesk' (sans-serif) for headings, and 'Inter' (sans-serif) for body text.
- Code font: 'Source Code Pro' for displaying code snippets.
- Dashboard-style layout with a clean, structured design. Sidebar navigation for key sections (Dashboard, Products, POS, Sales, Settings).
- Use minimalist icons from a set like Remix Icon to ensure clarity and a modern aesthetic throughout the UI.