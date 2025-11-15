import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import { db, users, superAdmins, tenants } from '@/db';
import { eq } from 'drizzle-orm';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },

  // Pages - base login is the general entry point; admin uses /admin/login via middleware
  pages: {
    signIn: '/login',
    error: '/login',
  },

  // Credentials provider
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Check super admin
        const [superAdmin] = await db
          .select()
          .from(superAdmins)
          .where(eq(superAdmins.email, credentials.email))
          .limit(1);

        if (superAdmin) {
          const valid = await compare(credentials.password, superAdmin.password);
          if (!valid) return null;

          return {
            id: superAdmin.id,
            email: superAdmin.email,
            name: superAdmin.name,
            role: 'super_admin',
            isSuperAdmin: true,
          };
        }

        // Regular user
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email))
          .limit(1);

        if (!user) return null;
        const valid = await compare(credentials.password, user.password);
        if (!valid) return null;

        // Tenant status check
        const [tenant] = await db
          .select()
          .from(tenants)
          .where(eq(tenants.id, user.tenantId))
          .limit(1);

        if (!tenant || tenant.status === 'suspended') return null;

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

  // JWT & session callbacks
  callbacks: {
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
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.tenantId = token.tenantId;
        session.user.avatarUrl = token.avatarUrl;
        session.user.isSuperAdmin = token.isSuperAdmin;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect after login
      return url.startsWith(baseUrl) ? url : baseUrl;
    },
  },

};
