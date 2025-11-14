import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db, users, superAdmins, tenants } from '@/db';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    // Use admin login as the NextAuth sign-in page; base /login stays tenant/general.
    signIn: '/admin/login',
    error: '/admin/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Try to find super admin first
        const [superAdmin] = await db
          .select()
          .from(superAdmins)
          .where(eq(superAdmins.email, credentials.email))
          .limit(1);

        if (superAdmin) {
          const isPasswordValid = await compare(credentials.password, superAdmin.password);
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: 'super_admin',
            isSuperAdmin: true,
          };
        }

        // Try to find regular user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        // Enforce tenant suspension: block login if the tenant is suspended
        const [tenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, user.tenantId))
          .limit(1);

        if (!tenant || tenant.status === 'suspended') {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          avatarUrl: user.avatarUrl || undefined,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      try {
        const base = new URL(baseUrl);
        const host = base.host;

        // If URL is already on our origin, honor it.
        if (url.startsWith(baseUrl)) return url;

        // Admin host: always land on admin dashboard after auth.
        if (host.startsWith('admin.')) {
          return `${baseUrl}/admin/dashboard`;
        }

        // Default: go to base URL (landing or tenant host root).
        return baseUrl;
      } catch {
        return baseUrl;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.avatarUrl = user.avatarUrl;
        token.isSuperAdmin = user.isSuperAdmin || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean | undefined;
        
        // For super admins, don't fetch from users table
        if (token.isSuperAdmin) {
          session.user.tenantId = undefined;
          session.user.avatarUrl = token.avatarUrl as string | undefined;
        } else {
          // Fetch latest user data from database to get updated avatar
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, token.id as string))
            .limit(1);
          
          session.user.tenantId = token.tenantId as string | undefined;
          session.user.avatarUrl = user?.avatarUrl || token.avatarUrl as string | undefined;
        }
      }
      return session;
    },
  },
};
