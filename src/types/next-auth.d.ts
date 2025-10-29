import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      tenantId?: string;
      avatarUrl?: string | null;
      isSuperAdmin?: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId?: string;
    avatarUrl?: string | null;
    isSuperAdmin?: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;
    tenantId?: string;
    avatarUrl?: string | null;
    isSuperAdmin?: boolean;
  }
}
