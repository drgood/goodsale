import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, superAdmins, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const allAdmins = await db.select().from(superAdmins);
    
    // Don't return passwords
    const sanitized = allAdmins.map(admin => {
      const { password, ...rest } = admin;
      return rest;
    });

    return NextResponse.json(sanitized);
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admins' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existing = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.email, email));

    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await db
      .insert(superAdmins)
      .values({
        name,
        email,
        password: hashedPassword,
        status: 'active',
      })
      .returning();

    // Log the action
    try {
      await db.insert(auditLogs).values({
        userId: null,
        userName: token.name as string,
        action: 'CREATE_ADMIN',
        entity: 'super_admin',
        entityId: newAdmin[0].id,
        details: { name, email },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    // Don't return password
    const { password: _, ...result } = newAdmin[0];
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}
