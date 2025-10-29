import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db, notifications } from '@/db';
import { eq, and, desc } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const isRead = url.searchParams.get('isRead');

    let query = db.select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, session.user.id),
          eq(notifications.tenantId, session.user.tenantId)
        )
      )
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    if (isRead !== null) {
      const shouldBeRead = isRead === 'true';
      query = db.select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.tenantId, session.user.tenantId),
            eq(notifications.isRead, shouldBeRead)
          )
        )
        .orderBy(desc(notifications.createdAt))
        .limit(limit);
    }

    const userNotifications = await query;
    return NextResponse.json(userNotifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action, notificationIds } = body;

    if (action === 'mark-as-read') {
      if (!notificationIds || notificationIds.length === 0) {
        return NextResponse.json(
          { error: 'No notification IDs provided' },
          { status: 400 }
        );
      }

      // Update only notifications belonging to the current user
      await db.update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, session.user.id),
            // Check if the notification ID is in the provided list
          )
        );

      // Manually update each notification to ensure they belong to the user
      for (const id of notificationIds) {
        await db.update(notifications)
          .set({ isRead: true })
          .where(
            and(
              eq(notifications.id, id),
              eq(notifications.userId, session.user.id)
            )
          );
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'mark-all-as-read') {
      await db.update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.userId, session.user.id),
            eq(notifications.tenantId, session.user.tenantId),
            eq(notifications.isRead, false)
          )
        );

      return NextResponse.json({ success: true });
    }

    if (action === 'delete') {
      if (!notificationIds || notificationIds.length === 0) {
        return NextResponse.json(
          { error: 'No notification IDs provided' },
          { status: 400 }
        );
      }

      for (const id of notificationIds) {
        await db.delete(notifications)
          .where(
            and(
              eq(notifications.id, id),
              eq(notifications.userId, session.user.id)
            )
          );
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
