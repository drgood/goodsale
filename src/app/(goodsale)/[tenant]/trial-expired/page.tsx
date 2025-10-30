'use client';

import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, AlertCircle, MailOpen } from 'lucide-react';
import Link from 'next/link';

export default function TrialExpiredPage() {
  const params = useParams();
  const tenant = params.tenant as string;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-red-200 dark:border-red-900">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-red-100 dark:bg-red-900 rounded-full p-4">
              <Clock className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">Your Trial Has Expired</CardTitle>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Your 14-day free trial has ended. Upgrade now to continue using GoodSale.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alert Box */}
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-800 dark:text-orange-200">
                <p className="font-semibold mb-1">Your data is safe</p>
                <p>
                  Your data will be kept for 14 days. Upgrade your subscription to regain access
                  and continue where you left off.
                </p>
              </div>
            </div>
          </div>

          {/* Features List */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
            <p className="font-semibold text-gray-900 dark:text-white mb-4">When you upgrade, you&apos;ll regain access to:</p>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Point of Sale (POS) system</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Inventory management</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Customer management</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>Sales reports & analytics</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <span>All your business data</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-4">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400 mb-2">
              Payment method: Cash transfer accepted. Contact our sales team after payment.
            </div>
            
            <Link href={`/${tenant}/billing`} className="block">
              <Button
                className="w-full bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white py-6 text-lg"
              >
                View Subscription Plans
              </Button>
            </Link>

            <a href="mailto:sales@goodsale.com" className="block">
              <Button
                variant="outline"
                className="w-full py-6 text-lg gap-2"
              >
                <MailOpen className="w-5 h-5" />
                Contact Sales Team
              </Button>
            </a>
          </div>

          {/* Info Section */}
          <div className="text-center text-xs text-gray-500 dark:text-gray-400 space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p>
              <strong>Cash Payment:</strong> Send payment details to sales@goodsale.com
            </p>
            <p>
              <strong>Support:</strong> Available 24/7 at support@goodsale.com
            </p>
            <p className="pt-2">
              Questions? We&apos;re here to help. Don&apos;t hesitate to reach out!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
