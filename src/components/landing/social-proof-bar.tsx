'use client';

import { useEffect, useState } from 'react';
import { Package2, TrendingUp, Star } from 'lucide-react';

interface CounterProps {
  target: number;
  duration: number;
  suffix?: string;
  prefix?: string;
}

function AnimatedCounter({ target, duration, suffix = '', prefix = '' }: CounterProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16); // 60fps
    let currentValue = start;

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(currentValue));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return (
    <span>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

export function SocialProofBar() {
  return (
    <section className="w-full py-8 px-4 bg-gradient-to-r from-purple-600 to-green-600 text-white border-y border-purple-700">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stores */}
          <div className="flex items-center justify-center gap-3">
            <Package2 className="w-6 h-6" />
            <div>
              <p className="text-sm font-medium opacity-90">Active Stores</p>
              <p className="text-2xl font-bold">
                <AnimatedCounter target={2000} duration={2000} suffix="+" />
              </p>
            </div>
          </div>

          {/* Sales Processed */}
          <div className="flex items-center justify-center gap-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <p className="text-sm font-medium opacity-90">Sales Processed</p>
              <p className="text-2xl font-bold">
                <AnimatedCounter target={50} duration={2000} prefix="$" suffix="M+" />
              </p>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center justify-center gap-3">
            <Star className="w-6 h-6 fill-white" />
            <div>
              <p className="text-sm font-medium opacity-90">Customer Rating</p>
              <p className="text-2xl font-bold">
                <AnimatedCounter target={4.9} duration={2000} suffix="/5 ⭐" />
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
