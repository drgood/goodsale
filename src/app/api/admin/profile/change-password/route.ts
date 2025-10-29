import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, superAdmins, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';
import { compare, hash } from 'bcryptjs';

export async function POST(request: NextRequest) {
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
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current and new passwords are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Get super admin from database
    const [admin] = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.id, token.id as string))
      .limit(1);

    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await compare(currentPassword, admin.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await hash(newPassword, 10);

    // Update password
    await db
      .update(superAdmins)
      .set({
        password: hashedPassword,
      })
      .where(eq(superAdmins.id, token.id as string));

    // Log the action (userId null since super admins aren't in users table)
    await db.insert(auditLogs).values({
      userId: null,
      userName: token.name as string,
      action: 'CHANGE_PASSWORD',
      entity: 'super_admin',
      entityId: token.id as string,
      details: {
        description: 'Password changed',
      },
    }).catch(err => console.error('Audit log error:', err));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
