import { db, superAdmins } from '@/db';
import { hash } from 'bcryptjs';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('Creating Super Admin...\n');

  const name = await question('Enter super admin name: ');
  const email = await question('Enter super admin email: ');
  const password = await question('Enter super admin password: ');

  if (!name || !email || !password) {
    console.error('Error: All fields are required');
    process.exit(1);
  }

  try {
    // Check if super admin already exists
    const existing = await db.query.superAdmins.findFirst({
      where: (superAdmins, { eq }) => eq(superAdmins.email, email),
    });

    if (existing) {
      console.error(`Error: Super admin with email "${email}" already exists`);
      process.exit(1);
    }

    // Hash the password
    const hashedPassword = await hash(password, 10);

    // Create super admin
    const result = await db.insert(superAdmins).values({
      name,
      email,
      password: hashedPassword,
      status: 'active',
    });

    console.log('\n✓ Super admin created successfully!');
    console.log(`  Name: ${name}`);
    console.log(`  Email: ${email}`);
    console.log('\nYou can now login at: /admin/login');

    process.exit(0);
  } catch (error) {
    console.error('Error creating super admin:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();
