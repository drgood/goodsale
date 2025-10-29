import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, superAdmins, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { name, email, password: newPassword, status } = body;

    // Verify admin exists
    const existing = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.id, id));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    // Check if email is being changed and if new email already exists
    if (email && email !== existing[0].email) {
      const emailExists = await db
        .select()
        .from(superAdmins)
        .where(eq(superAdmins.email, email));

      if (emailExists.length > 0) {
        return NextResponse.json(
          { error: 'Email already in use' },
          { status: 400 }
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (status) updates.status = status;
    if (newPassword) {
      updates.password = await bcrypt.hash(newPassword, 10);
    }

    const updated = await db
      .update(superAdmins)
      .set(updates)
      .where(eq(superAdmins.id, id))
      .returning();

    // Log the action
    try {
      await db.insert(auditLogs).values({
        userId: null,
        userName: token.name as string,
        action: 'UPDATE_ADMIN',
        entity: 'super_admin',
        entityId: id,
        details: { changes: Object.keys(updates).filter(k => k !== 'password') },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    // Don't return password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updated[0];
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error updating admin:', error);
    return NextResponse.json(
      { error: 'Failed to update admin' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Prevent deleting yourself
    if (id === token.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    // Verify admin exists
    const existing = await db
      .select()
      .from(superAdmins)
      .where(eq(superAdmins.id, id));

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Admin not found' },
        { status: 404 }
      );
    }

    const adminName = existing[0].name;
    const adminEmail = existing[0].email;

    // Delete admin
    await db.delete(superAdmins).where(eq(superAdmins.id, id));

    // Log the action
    try {
      await db.insert(auditLogs).values({
        userId: null,
        userName: token.name as string,
        action: 'DELETE_ADMIN',
        entity: 'super_admin',
        entityId: id,
        details: { adminName, adminEmail },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    return NextResponse.json(
      { error: 'Failed to delete admin' },
      { status: 500 }
    );
  }
}
