'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Play } from 'lucide-react';

export function HeroSection() {
  return (
    <section className="w-full py-20 px-4 md:py-32 bg-gradient-to-br from-purple-50 to-green-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left: Text */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Stop Managing.{' '}
              <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                Start Growing.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              POS, inventory, customers, and insights—unified. Process sales faster, stock smarter, and make data-driven decisions. Scale from one location to multi-store empires.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Link href="/signup" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700 text-white gap-2"
              >
                Start Your 14-Day Free Trial
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto gap-2"
              asChild
            >
              <Link href="#demo">
                <Play className="w-4 h-4" />
                Watch Demo
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="pt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>✅ No credit card required</p>
            <p>✅ 30-day money-back guarantee</p>
          </div>
        </div>

        {/* Right: Visual (Mockup) */}
        <div className="relative h-96 md:h-full flex items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-green-200 rounded-2xl opacity-30 blur-3xl"></div>
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 dark:text-white">Today&apos;s Sales</h3>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">
                  GH₵12,450
                </span>
              </div>
              <div className="h-40 bg-gradient-to-br from-purple-100 to-green-100 dark:from-purple-900 dark:to-green-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl font-bold text-gray-700 dark:text-gray-300">📊</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Sales Dashboard</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Transactions</p>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">234</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-3 rounded-lg text-center">
                  <p className="text-xs text-gray-600 dark:text-gray-400">Customers</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">1,248</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
