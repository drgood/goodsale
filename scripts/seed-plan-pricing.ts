import { db, plans, planPricing } from '@/db';
import { and, eq } from 'drizzle-orm';

async function seedPlanPricing() {
  console.log('🌱 Seeding plan pricing...');

  try {
    // Get all plans
    const allPlans = await db.select().from(plans);

    if (allPlans.length === 0) {
      console.log('❌ No plans found. Please seed plans first.');
      return;
    }

    console.log(`Found ${allPlans.length} plans`);

    const billingPeriods = [
      { period: '1_month', months: 1, discount: 0 },
      { period: '6_months', months: 6, discount: 10 }, // 10% discount
      { period: '12_months', months: 12, discount: 15 }, // 15% discount
      { period: '24_months', months: 24, discount: 20 }, // 20% discount
    ];

    for (const plan of allPlans) {
      // Parse the base price from the plan
      const basePrice = parseFloat(plan.price.replace(/[^0-9.]/g, ''));

      if (isNaN(basePrice)) {
        console.log(`⚠️  Skipping ${plan.name} - invalid price format: ${plan.price}`);
        continue;
      }

      console.log(`\n📋 Processing ${plan.name} (Base: GH₵${basePrice})`);

      for (const { period, months, discount } of billingPeriods) {
        // Calculate total price for the period
        const totalBeforeDiscount = basePrice * months;
        const discountAmount = (totalBeforeDiscount * discount) / 100;
        const finalPrice = totalBeforeDiscount - discountAmount;

        // Check if pricing already exists
        const existing = await db
          .select()
          .from(planPricing)
          .where(
            and(
              eq(planPricing.planId, plan.id),
              eq(planPricing.billingPeriod, period)
            )
          );

        if (existing.length > 0) {
          console.log(`  ✓ ${period} already exists (GH₵${existing[0].price})`);
          continue;
        }

        // Insert pricing
        await db.insert(planPricing).values({
          planId: plan.id,
          billingPeriod: period,
          price: finalPrice.toFixed(2),
          discountPercent: discount.toString(),
        });

        console.log(`  + ${period}: GH₵${finalPrice.toFixed(2)} (${discount}% off)`);
      }
    }

    console.log('\n✅ Plan pricing seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding plan pricing:', error);
    throw error;
  }
}

// Run the seed
seedPlanPricing()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
