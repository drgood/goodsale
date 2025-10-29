import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUsersByTenant } from '@/lib/queries';
import { db, users } from '@/db';
import { eq, and } from 'drizzle-orm';
import { hash } from 'bcryptjs';
import { notifyTeamManagers } from '@/lib/notification-helpers';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const teamUsers = await getUsersByTenant(session.user.tenantId as string);
    return NextResponse.json(teamUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = session.user.role?.toLowerCase();
  if (userRole !== 'owner' && userRole !== 'manager' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions to create users' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, email, role, password } = body;
    
    // Validate role
    const validRoles = ['owner', 'manager', 'cashier'];
    if (!validRoles.includes(role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }
    
    const hashedPassword = await hash(password, 10);
    
    // Generate Picsum avatar for new users (fallback)
    const seed = name.toLowerCase().replace(/\s+/g, '');
    const avatarUrl = `https://picsum.photos/seed/${seed}/128/128`;
    
    const [newUser] = await db.insert(users).values({
      tenantId: session.user.tenantId as string,
      name,
      email,
      password: hashedPassword,
      role: role.toLowerCase(),
      avatarUrl,
    }).returning();
    
    // Notify team managers about the new team member
    try {
      await notifyTeamManagers(
        session.user.tenantId as string,
        'user',
        'New Team Member',
        `${newUser.name} has joined your team as ${newUser.role}`
      );
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Don't fail user creation if notification fails
    }
    
    return NextResponse.json(newUser);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error creating user:', errorMessage);
    console.error('Full error:', error);
    
    // Check for duplicate email within tenant
    if (errorMessage.includes('unique')) {
      return NextResponse.json(
        { error: 'Email already exists in this tenant' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: `Failed to create user: ${errorMessage}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, role, name, email, avatarUrl } = body;
    
    // Allow users to update their own profile, or managers/admins to update roles
    const isOwnProfile = session.user.id === id;
    const userRole = session.user.role?.toLowerCase();
    const isAdmin = userRole === 'owner' || userRole === 'manager' || userRole === 'admin';
    
    if (!isOwnProfile && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const updateData: Partial<typeof users.$inferInsert> = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (role !== undefined && isAdmin) updateData.role = role;
    
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(and(eq(users.id, id), eq(users.tenantId, session.user.tenantId as string)))
      .returning();
    
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error updating user:', message);
    if (message.includes('email_tenant_idx') || message.toLowerCase().includes('unique')) {
      return NextResponse.json({ error: 'Email already exists in this tenant' }, { status: 409 });
    }
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const userRole = session.user.role?.toLowerCase();
  if (userRole !== 'owner' && userRole !== 'manager' && userRole !== 'admin') {
    return NextResponse.json({ error: 'Insufficient permissions to delete users' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id } = body;
    
    const result = await db.delete(users).where(
      and(eq(users.id, id), eq(users.tenantId, session.user.tenantId as string))
    ).returning();
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
