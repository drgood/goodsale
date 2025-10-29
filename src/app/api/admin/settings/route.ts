import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { db, platformSettings, auditLogs } from '@/db';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await db.select().from(platformSettings).limit(1);
    
    if (settings.length === 0) {
      // Create default settings if none exist
      const newSettings = await db
        .insert(platformSettings)
        .values({
          platformName: 'GoodSale',
          currency: 'GHS',
          taxRate: '0',
          enforceMfa: false,
        })
        .returning();
      return NextResponse.json(newSettings[0]);
    }

    return NextResponse.json(settings[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({ req: request });

    if (!token?.isSuperAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      platformName?: string;
      currency?: string;
      taxRate?: number;
      enforceMfa?: boolean;
    };
    const { platformName, currency, taxRate, enforceMfa } = body;

    const existingSettings = await db.select().from(platformSettings).limit(1);
    let settingsId: string;

    if (existingSettings.length === 0) {
      // Create default settings if none exist
      const newSettings = await db
        .insert(platformSettings)
        .values({
          platformName: platformName || 'GoodSale',
          currency: currency || 'GHS',
          taxRate: taxRate?.toString() || '0',
          enforceMfa: enforceMfa ?? false,
        })
        .returning();
      settingsId = newSettings[0].id;
    } else {
      // Update existing settings
      settingsId = existingSettings[0].id;
      const updateData: any = {};
      if (platformName !== undefined) updateData.platformName = platformName;
      if (currency !== undefined) updateData.currency = currency;
      if (taxRate !== undefined) updateData.taxRate = taxRate.toString();
      if (enforceMfa !== undefined) updateData.enforceMfa = enforceMfa;
      updateData.updatedAt = new Date();
      
      await db
        .update(platformSettings)
        .set(updateData)
        .where(eq(platformSettings.id, settingsId));
    }

    // Log the update
    try {
      await db.insert(auditLogs).values({
        userId: null,
        userName: token.name as string,
        action: 'UPDATE_SETTINGS',
        entity: 'platform_settings',
        entityId: settingsId,
        details: { platformName, currency, taxRate, enforceMfa },
      });
    } catch (auditErr) {
      console.error('Audit log error:', auditErr);
    }

    const updated = await db.select().from(platformSettings).where(eq(platformSettings.id, settingsId));
    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
