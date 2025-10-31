import { NextRequest, NextResponse } from 'next/server';
import { db, tenants, users, auditLogs, subscriptions, plans } from '@/db';
import { eq } from 'drizzle-orm';
import { hash } from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, shopName, subdomain, planId } = body;

    // Validation
    if (!name || !email || !password || !shopName || !subdomain || !planId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if subdomain already exists
    const existingSubdomain = await db
      .select()
      .from(tenants)
      .where(eq(tenants.subdomain, subdomain.toLowerCase()))
      .limit(1);

    if (existingSubdomain.length > 0) {
      return NextResponse.json(
        { error: 'Subdomain is already taken' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: 'Email is already in use' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Fetch plan name from planId
    const [selectedPlan] = await db
      .select()
      .from(plans)
      .where(eq(plans.id, planId))
      .limit(1);

    if (!selectedPlan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Create tenant
    const newTenant = await db
      .insert(tenants)
      .values({
        name: shopName,
        subdomain: subdomain.toLowerCase(),
        plan: selectedPlan.name,
        status: 'active',
      })
      .returning();

    if (newTenant.length === 0) {
      throw new Error('Failed to create tenant');
    }

    const tenant = newTenant[0];

    // Create user (owner)
    const newUser = await db
      .insert(users)
      .values({
        tenantId: tenant.id,
        name: name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: 'owner',
        status: 'active',
      })
      .returning();

    if (newUser.length === 0) {
      throw new Error('Failed to create user');
    }

    // Create trial subscription (14 days)
    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    const newSubscription = await db
      .insert(subscriptions)
      .values({
        tenantId: tenant.id,
        planId: planId,
        billingPeriod: '1_month',
        status: 'trial',
        startDate: new Date(),
        endDate: trialEndDate,
        autoRenewal: false,
        amount: '0',
      })
      .returning();

    if (newSubscription.length === 0) {
      throw new Error('Failed to create trial subscription');
    }

    // Log the signup
    await db
      .insert(auditLogs)
      .values({
        userId: newUser[0].id,
        userName: name,
        action: 'TENANT_SIGNUP',
        entity: 'tenant',
        entityId: tenant.id,
        details: {
          tenantName: shopName,
          subdomain: subdomain,
          email: email,
          trialEndDate: trialEndDate,
          subscriptionId: newSubscription[0].id,
        },
      })
      .catch((err) => console.error('Audit log error:', err));

    return NextResponse.json(
      {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
        userId: newUser[0].id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during signup:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to create account',
      },
      { status: 500 }
    );
  }
}
