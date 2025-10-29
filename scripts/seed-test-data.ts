import { db, superAdmins, plans, tenants } from '@/db';
import { hash } from 'bcryptjs';

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...\n');

    // Check if super admin already exists
    const existingAdmin = await db.query.superAdmins.findFirst({
      where: (superAdmins, { eq }) => eq(superAdmins.email, 'drgood@goodsale.com'),
    });

    if (!existingAdmin) {
      console.log('📝 Creating super admin...');
      const hashedPassword = await hash('SecurePassword123', 10);
      
      await db.insert(superAdmins).values({
        name: 'Dr Good',
        email: 'admin@goodsale.com',
        password: hashedPassword,
        status: 'active',
      });
      
      console.log('✅ Super admin created!');
      console.log('   Email: drgood@goodsale.com');
      console.log('   Password: SecurePassword123\n');
    } else {
      console.log('✅ Super admin already exists\n');
    }

    // Check if plans already exist
    const existingPlans = await db.query.plans.findFirst();
    
    if (!existingPlans) {
      console.log('📝 Creating subscription plans...');
      
      const starterPlan = await db.insert(plans).values({
        name: 'Starter',
        price: 'GH₵99/month',
        description: 'Perfect for small businesses',
        features: [
          'Up to 5 users',
          'Basic reporting',
          'Email support',
          'Single store location',
          'Inventory management',
        ],
        isCurrent: false,
      });

      const growthPlan = await db.insert(plans).values({
        name: 'Growth',
        price: 'GH₵499/month',
        description: 'For growing retail businesses',
        features: [
          'Up to 25 users',
          'Advanced reporting',
          'Priority support',
          'Multiple store locations',
          'Inventory management',
          'Customer analytics',
          'API access',
        ],
        isCurrent: true,
      });

      const enterprisePlan = await db.insert(plans).values({
        name: 'Enterprise',
        price: 'Custom',
        description: 'For large enterprises',
        features: [
          'Unlimited users',
          'Custom reporting',
          'Dedicated support',
          'Unlimited store locations',
          'Advanced inventory',
          'Custom integrations',
          'Dedicated account manager',
          'SLA guarantee',
        ],
        isCurrent: false,
      });

      console.log('✅ Plans created!');
      console.log('   - Starter');
      console.log('   - Growth');
      console.log('   - Enterprise\n');
    } else {
      console.log('✅ Plans already exist\n');
    }

    // Check if test tenants exist
    const existingTenants = await db.query.tenants.findFirst();
    
    if (!existingTenants) {
      console.log('📝 Creating test tenants...');
      
      await db.insert(tenants).values({
        name: 'TechStore Ghana',
        subdomain: 'techstore',
        plan: 'growth',
        status: 'active',
        userCount: 12,
        productCount: 245,
        totalSales: '125500.50',
      });

      await db.insert(tenants).values({
        name: 'Fashion Hub Accra',
        subdomain: 'fashionhub',
        plan: 'starter',
        status: 'active',
        userCount: 5,
        productCount: 89,
        totalSales: '45200.00',
      });

      await db.insert(tenants).values({
        name: 'Premium Electronics',
        subdomain: 'premium-elec',
        plan: 'enterprise',
        status: 'active',
        userCount: 45,
        productCount: 1250,
        totalSales: '890750.75',
      });

      await db.insert(tenants).values({
        name: 'Quick Mart Kumasi',
        subdomain: 'quickmart',
        plan: 'starter',
        status: 'suspended',
        userCount: 3,
        productCount: 45,
        totalSales: '12300.00',
      });

      console.log('✅ Test tenants created!');
      console.log('   - TechStore Ghana (Active)');
      console.log('   - Fashion Hub Accra (Active)');
      console.log('   - Premium Electronics (Active)');
      console.log('   - Quick Mart Kumasi (Suspended)\n');
    } else {
      console.log('✅ Tenants already exist\n');
    }

    console.log('🎉 Test data seeding complete!\n');
    console.log('📋 You can now test the super admin login:');
    console.log('   URL: http://localhost:9002/admin/login');
    console.log('   Email: admin@goodsale.com');
    console.log('   Password: SecurePassword123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
}

seedTestData();
