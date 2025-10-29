'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Testimonial {
  id: number;
  quote: string;
  author: string;
  company: string;
  location: string;
  avatar: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      'We cut our inventory counting time by 15 hours a week. GoodSale paid for itself in the first month. The clarity we have on our business is incredible.',
    author: 'Maria S.',
    company: 'The Urban Grocer',
    location: 'Accra',
    avatar: '👩‍💼',
  },
  {
    id: 2,
    quote:
      'Our profit margins improved by 8% just from better data insights. We can now see exactly which products make money. GoodSale literally pays for itself.',
    author: 'Ahmed K.',
    company: 'Urban Retail Co.',
    location: 'Lagos',
    avatar: '👨‍💼',
  },
  {
    id: 3,
    quote:
      'When we migrated from our old system, GoodSale\'s team personally helped us import 5 years of data. No hassle, zero data loss. Customer service is incredible.',
    author: 'Fatima L.',
    company: 'The Fashion Hub',
    location: 'Kano',
    avatar: '👩‍🦱',
  },
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="w-full py-20 px-4 md:py-32 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Trusted by <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">2,000+ Store Owners</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            See what real retailers are saying about GoodSale
          </p>
        </div>

        {/* Testimonial Carousel */}
        <div className="max-w-3xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 border border-gray-200 dark:border-gray-700">
            {/* Stars */}
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              ))}
            </div>

            {/* Quote */}
            <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 mb-8 leading-relaxed italic">
              &quot;{currentTestimonial.quote}&quot;
            </p>

            {/* Author */}
            <div className="flex items-center gap-4">
              <div className="text-4xl">{currentTestimonial.avatar}</div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {currentTestimonial.author}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentTestimonial.company} • {currentTestimonial.location}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevTestimonial}
                  className="gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextTestimonial}
                  className="gap-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === currentIndex
                        ? 'bg-gradient-to-r from-purple-600 to-green-600 w-8'
                        : 'bg-gray-300 dark:bg-gray-600 w-2'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Featured Customer Logos */}
        <div className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-700">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8">
            Trusted by leading retailers across Africa
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {['🏪', '🛍️', '💼', '🏬', '📦'].map((logo, i) => (
              <div key={i} className="text-4xl opacity-60 hover:opacity-100 transition-opacity">
                {logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
