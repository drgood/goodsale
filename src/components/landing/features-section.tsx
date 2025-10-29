'use client';

import { ShoppingCart, Package, Users, BarChart3, Map, Lock } from 'lucide-react';

interface Feature {
  id: string;
  title: string;
  description: string;
  benefit: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const features: Feature[] = [
  {
    id: '1',
    title: 'Lightning-Fast POS',
    description: 'Process sales, accept all payment methods (card, cash, mobile money), and sync instantly across devices. Works online and offline.',
    benefit: 'Faster Checkouts',
    icon: <ShoppingCart className="w-8 h-8" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900',
  },
  {
    id: '2',
    title: 'Real-Time Inventory Sync',
    description: 'Track inventory across locations, auto-generate purchase orders, and get low-stock alerts. Prevents lost sales and dead capital.',
    benefit: '100% Inventory Visibility',
    icon: <Package className="w-8 h-8" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900',
  },
  {
    id: '3',
    title: 'Customer Intelligence',
    description: 'Track purchase history, identify top spenders, and run targeted loyalty campaigns. Build relationships, not just transactions.',
    benefit: 'Loyalty & Retention ↑',
    icon: <Users className="w-8 h-8" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900',
  },
  {
    id: '4',
    title: 'Business Analytics & Reporting',
    description: 'Beautiful, actionable reports on sales trends, product performance, and profitability. Make data-driven decisions in minutes, not weeks.',
    benefit: 'Smarter Decisions',
    icon: <BarChart3 className="w-8 h-8" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900',
  },
  {
    id: '5',
    title: 'Multi-Location Management',
    description: 'Manage multiple locations from one dashboard. Centralized reporting, separate inventory, consistent operations across your empire.',
    benefit: 'Effortless Scaling',
    icon: <Map className="w-8 h-8" />,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900',
  },
  {
    id: '6',
    title: 'Enterprise-Grade Security',
    description: '256-bit encryption, daily backups, 99.9% uptime SLA, and GDPR compliance. Your data is safer in the cloud than on a local server.',
    benefit: 'Peace of Mind',
    icon: <Lock className="w-8 h-8" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900',
  },
];

export function FeaturesSection() {
  return (
    <section className="w-full py-20 px-4 md:py-32">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Everything You Need to <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">Scale Your Business</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Six powerful features designed to help retail businesses grow faster and smarter.
          </p>
        </div>

        {/* Features Grid */}
        <div className="space-y-16 md:space-y-24">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center ${
                index % 2 === 1 ? 'md:grid-flow-dense' : ''
              }`}
            >
              {/* Content */}
              <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                <div className={`inline-block p-3 rounded-lg ${feature.bgColor} mb-4`}>
                  <div className={feature.color}>{feature.icon}</div>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6 leading-relaxed">
                  {feature.description}
                </p>
                <div className="inline-block px-4 py-2 bg-gradient-to-r from-purple-100 to-green-100 dark:from-purple-900 dark:to-green-900 rounded-full">
                  <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent font-semibold">
                    ✨ {feature.benefit}
                  </span>
                </div>
              </div>

              {/* Visual */}
              <div className={`relative h-80 md:h-96 flex items-center justify-center ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-green-200 dark:from-purple-900 dark:to-green-900 rounded-2xl opacity-20 blur-2xl"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8 max-w-sm w-full border border-gray-200 dark:border-gray-700">
                  <div className={`p-12 rounded-lg ${feature.bgColor} flex items-center justify-center`}>
                    <div className={`text-5xl ${feature.color}`}>{feature.icon}</div>
                  </div>
                  <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                    Feature Preview
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
