'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

interface PricingPlan {
  name: string;
  description: string;
  price: string;
  period: string;
  recommended: boolean;
  features: string[];
  cta: string;
}

const plans: PricingPlan[] = [
  {
    name: 'Starter',
    description: 'Perfect for solo operators & pop-ups',
    price: '29',
    period: '/month',
    recommended: false,
    features: [
      '1 Location',
      'Basic POS',
      'Inventory Management',
      'Sales Reports',
      'Email Support',
      'Up to 2 Users',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Business',
    description: 'For growing stores & franchises',
    price: '79',
    period: '/month',
    recommended: true,
    features: [
      'Up to 5 Locations',
      'Advanced POS',
      'Real-time Inventory Sync',
      'Advanced Analytics',
      'Multi-user Support',
      'Up to 10 Users',
      'Priority Support',
      'Custom Integrations',
    ],
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    description: 'For multi-location chains',
    price: 'Custom',
    period: 'Pricing',
    recommended: false,
    features: [
      'Unlimited Locations',
      'Custom Integrations',
      'Unlimited Users',
      'Dedicated Support',
      'Priority Features',
      'SLA Guarantee',
      'Advanced Security',
      'On-Site Training',
    ],
    cta: 'Book a Demo',
  },
];

export function PricingSection() {
  return (
    <section className="w-full py-20 px-4 md:py-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Simple, Transparent <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">Pricing</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            All plans include a full-featured 14-day free trial. No credit card required.
          </p>
          
          {/* Trust indicators */}
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>✅ Upgrade or downgrade anytime</p>
            <p>✅ Pro-rated billing • No penalties</p>
            <p>✅ 30-day money-back guarantee</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl transition-all duration-300 hover:shadow-xl ${
                plan.recommended
                  ? 'ring-2 ring-gradient-to-r from-purple-600 to-green-600 shadow-xl scale-105 md:scale-100'
                  : 'border border-gray-200 dark:border-gray-700'
              } bg-white dark:bg-gray-800 p-8`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-gradient-to-r from-purple-600 to-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                    ⭐ Recommended
                  </span>
                </div>
              )}

              {/* Plan Info */}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
              </div>

              {/* Pricing */}
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                {plan.price !== 'Custom' ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">${plan.price}</span>
                      <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                      Billed monthly • Annual discount: 15%
                    </p>
                  </>
                ) : (
                  <div className="text-2xl font-bold text-gray-700 dark:text-gray-200">
                    {plan.price} {plan.period}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link href={plan.name === 'Enterprise' ? '#' : '/signup'} className="w-full">
                <Button
                  className="w-full"
                  variant={plan.recommended ? 'default' : 'outline'}
                  size="lg"
                >
                  {plan.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 p-8 md:p-12 bg-gradient-to-r from-purple-50 to-green-50 dark:from-purple-900/20 dark:to-green-900/20 rounded-2xl border border-purple-200 dark:border-purple-700 text-center">
          <h3 className="text-2xl font-bold mb-4">Have questions about pricing?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Our sales team is ready to help. Schedule a personalized demo and get answers to all your questions.
          </p>
          <Button variant="default" className="bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700">
            Schedule a Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
