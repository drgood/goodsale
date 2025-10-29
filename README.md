# GoodSale - Inventory & POS SaaS Platform

**GoodSale** is a comprehensive, multi-tenant SaaS platform designed for modern retail businesses. It provides inventory management, point-of-sale functionality, and business analytics in a single, powerful solution.

## 🚀 Features

### Multi-Tenant Architecture
- **Tenant Portal**: Complete dashboard for shop owners and staff
- **Admin Panel**: Super admin interface for managing tenants and platform operations
- **Secure Data Isolation**: Each tenant's data is strictly segregated using database-level tenant filtering

### Core Functionality
- **Inventory Management**: Track products, categories, and suppliers
- **Point of Sale**: Process sales transactions with detailed line items
- **User Management**: Role-based access control within tenants
- **Settings & Configuration**: Customizable tenant-specific settings
- **AI Integration**: Google Genkit integration for enhanced functionality

### Modern Tech Stack
- **Frontend**: Next.js 15 with App Router, React 18, TypeScript
- **UI Components**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **Backend**: PostgreSQL with Drizzle ORM
- **Authentication**: NextAuth.js with credentials provider
- **AI**: Google Genkit with Gemini 2.5 Flash model
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts for data visualization
- **Offline Support**: Dexie.js for offline-first capabilities

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (version 18 or higher)
- **npm** or **pnpm** (recommended)
- **PostgreSQL** (version 14 or higher) or a cloud PostgreSQL provider
- **Google Cloud API Key** for Genkit AI features

## 🛠️ Setup Instructions

### 1. Clone the Repository
```bash
git clone <repository-url>
cd GoodSale
```

### 2. Install Dependencies
```bash
# Using npm
npm install

# Using pnpm (recommended)
pnpm install
```

### 3. Database Configuration

1. **Set up PostgreSQL**:
   - Install PostgreSQL locally or use a cloud provider:
     - [Neon](https://neon.tech/) (Recommended for serverless)
     - [Supabase](https://supabase.com/)
     - [Railway](https://railway.app/)
     - [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres)

2. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   # PostgreSQL Database
   DATABASE_URL=postgresql://username:password@localhost:5432/goodsale

   # NextAuth
   NEXTAUTH_URL=http://localhost:9002
   NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

   # Google AI (Genkit) Configuration
   GOOGLE_GENAI_API_KEY=your_google_ai_api_key
   ```

   Generate a secure `NEXTAUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```

3. **Create Database Schema**:
   ```bash
   # Push schema to database
   npm run db:push
   
   # Or generate and run migrations
   npm run db:generate
   npm run db:migrate
   ```

### 4. Development Server

```bash
# Start the development server with Turbopack
npm run dev
# or
pnpm dev
```

The application will be available at [http://localhost:9002](http://localhost:9002)

### 5. AI Development (Optional)

For AI feature development:
```bash
# Start Genkit development server
npm run genkit:dev
# or
npm run genkit:watch  # For auto-reload
```

## 🏗️ Project Structure

```
src/
├── app/
│   ├── (admin)/           # Super admin routes
│   │   └── admin/
│   │       ├── dashboard/
│   │       ├── tenants/
│   │       ├── plans/
│   │       └── settings/
│   ├── (auth)/            # Authentication layouts
│   ├── layout.tsx         # Root layout
│   ├── page.tsx          # Landing page
│   └── providers.tsx     # Context providers
├── components/
│   └── ui/               # Reusable UI components
└── ai/                   # AI/Genkit configuration
    ├── genkit.ts         # Genkit setup
    └── dev.ts           # Development server
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server (port 9002)
npm run genkit:dev       # Start Genkit AI development server
npm run genkit:watch     # Start Genkit with auto-reload

# Building & Production
npm run build           # Build for production
npm run start           # Start production server

# Code Quality
npm run lint            # Run ESLint
npm run typecheck       # Run TypeScript type checking

# Database
npm run db:generate     # Generate database migrations
npm run db:migrate      # Run database migrations
npm run db:push         # Push schema directly to database (dev)
npm run db:studio       # Open Drizzle Studio (database GUI)
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**
2. **Import project to Vercel**
3. **Add environment variables**:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_GENAI_API_KEY`
4. **Deploy**

### Other Platforms

This Next.js app can be deployed to any platform that supports Node.js:
- Railway
- Render
- AWS
- Digital Ocean

Make sure to:
1. Set up a PostgreSQL database
2. Run migrations: `npm run db:migrate`
3. Configure environment variables

## 🔐 Security

### Multi-Tenant Data Isolation

The application implements strict tenant-based data isolation through:
- **Database-Level Filtering**: All queries filter by `tenantId`
- **Row-Level Security**: PostgreSQL RLS can be enabled for additional security
- **API Authentication**: NextAuth.js session validation on all API routes
- **Password Security**: bcrypt hashing for user passwords

### Database Schema
All tables include a `tenantId` foreign key:
```sql
tenants
├── users (tenantId)
├── products (tenantId)
├── sales (tenantId)
├── categories (tenantId)
├── suppliers (tenantId)
├── customers (tenantId)
└── settings (tenantId)
```

## 🎨 Customization

### Design System
- **Fonts**: Space Grotesk (headlines), Inter (body), Source Code Pro (code)
- **Colors**: CSS custom properties with HSL values
- **Components**: Built with Radix UI primitives and shadcn/ui

### Tailwind Configuration
Custom design tokens are defined in `tailwind.config.ts` with:
- Extended color palette
- Custom font families
- Animation utilities
- Responsive breakpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

© 2024 GoodSale. All rights reserved.

## 📞 Support

For support or questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ using Next.js, Firebase, and modern web technologies.**
