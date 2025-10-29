import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, superAdmins, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    // Verify super admin
    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    // Validate input
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Check if email is already in use by another admin
    if (email !== token.email) {
      const existing = await db
        .select()
        .from(superAdmins)
        .where(eq(superAdmins.email, email))
        .limit(1);

      if (existing.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    // Update super admin
    const updated = await db
      .update(superAdmins)
      .set({
        name,
        email,
      })
      .where(eq(superAdmins.id, token.id as string))
      .returning();

    // Log the action (userId null since super admins aren't in users table)
    await db.insert(auditLogs).values({
      userId: null,
      userName: token.name as string,
      action: 'UPDATE_PROFILE',
      entity: 'super_admin',
      entityId: token.id as string,
      details: {
        changes: { name, email },
      },
    }).catch(err => console.error('Audit log error:', err));

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
