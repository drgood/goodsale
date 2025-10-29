import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user.tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await db.select()
      .from(schema.settings)
      .where(eq(schema.settings.tenantId, session.user.tenantId as string))
      .limit(1);
    
    if (!result[0]) {
      // Return default settings if none exist
      return NextResponse.json({
        shopName: '',
        logoUrl: '',
        receiptHeader: '',
        receiptFooter: '',
        taxRate: 0,
        currency: 'GHS',
        posSettings: {}
      });
    }
    
    const settings = result[0];
    
    return NextResponse.json({
      id: settings.id,
      shopName: settings.shopName || '',
      logoUrl: settings.logoUrl || '',
      receiptHeader: settings.receiptHeader || '',
      receiptFooter: settings.receiptFooter || '',
      taxRate: parseFloat(settings.taxRate || '0'),
      currency: settings.currency || 'GHS',
      posSettings: settings.posSettings || {}
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
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
    
    // Check if settings already exist
    const existing = await db.select()
      .from(schema.settings)
      .where(eq(schema.settings.tenantId, session.user.tenantId as string))
      .limit(1);
    
    let result;
    
    if (existing[0]) {
      // Update existing settings
      result = await db.update(schema.settings)
        .set({
          shopName: body.shopName || null,
          logoUrl: body.logoUrl || null,
          receiptHeader: body.receiptHeader || null,
          receiptFooter: body.receiptFooter || null,
          taxRate: body.taxRate?.toString() || '0',
          currency: body.currency || 'GHS',
          posSettings: body.posSettings || {}
        })
        .where(eq(schema.settings.id, existing[0].id))
        .returning();
    } else {
      // Create new settings
      result = await db.insert(schema.settings)
        .values({
          tenantId: session.user.tenantId as string,
          shopName: body.shopName || null,
          logoUrl: body.logoUrl || null,
          receiptHeader: body.receiptHeader || null,
          receiptFooter: body.receiptFooter || null,
          taxRate: body.taxRate?.toString() || '0',
          currency: body.currency || 'GHS',
          posSettings: body.posSettings || {}
        })
        .returning();
    }
    
    const settings = result[0];
    
    return NextResponse.json({
      id: settings.id,
      shopName: settings.shopName || '',
      logoUrl: settings.logoUrl || '',
      receiptHeader: settings.receiptHeader || '',
      receiptFooter: settings.receiptFooter || '',
      taxRate: parseFloat(settings.taxRate || '0'),
      currency: settings.currency || 'GHS',
      posSettings: settings.posSettings || {}
    });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { error: 'Failed to save settings' },
      { status: 500 }
    );
  }
}
