import { db } from './src/db';
import { users } from './src/db/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';

async function testAuth() {
  console.log('🔍 Testing Authentication Setup\n');

  try {
    // Test 1: Check database connection
    console.log('1️⃣ Testing database connection...');
    const allUsers = await db.select().from(users);
    console.log(`   ✅ Found ${allUsers.length} users in database\n`);

    // Test 2: List all users with emails
    console.log('2️⃣ Available users:');
    allUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.role})`);
    });
    console.log('');

    // Test 3: Test password verification
    console.log('3️⃣ Testing password verification for owner@gshop.com...');
    const [testUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, 'owner@gshop.com'));

    if (!testUser) {
      console.log('   ❌ User not found!');
      return;
    }

    console.log(`   ✅ User found: ${testUser.name}`);
    console.log(`   📧 Email: ${testUser.email}`);
    console.log(`   👤 Role: ${testUser.role}`);
    console.log(`   🏢 Tenant ID: ${testUser.tenantId}`);
    console.log(`   🔐 Password Hash: ${testUser.password.substring(0, 20)}...`);

    // Test password
    const isValid = await compare('password123', testUser.password);
    console.log(`   🔓 Password "password123" valid: ${isValid ? '✅ YES' : '❌ NO'}\n`);

    // Test 4: Check environment variables
    console.log('4️⃣ Checking environment variables:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`   NEXTAUTH_URL: ${process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`   NEXTAUTH_SECRET: ${process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Not set'}\n`);

    console.log('✅ Authentication test complete!');
  } catch (error) {
    console.error('❌ Error:', error);
  }

  process.exit(0);
}

testAuth();
