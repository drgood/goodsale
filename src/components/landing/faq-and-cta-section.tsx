'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    question: 'Will GoodSale work with my existing hardware?',
    answer:
      'Yes! GoodSale runs on any iPad, Android tablet, PC, or Mac. We\'re hardware-agnostic, which means no expensive equipment replacement needed. If you already have devices, you\'re ready to go.',
  },
  {
    question: 'Can I import my existing data?',
    answer:
      'Absolutely. Our onboarding team handles free migration of your products, customers, and historical sales data—usually within 24 hours. We ensure zero data loss and a smooth transition.',
  },
  {
    question: 'What if I outgrow Starter? Can I upgrade?',
    answer:
      'Upgrade anytime—your data moves seamlessly between plans. You only pay the pro-rata difference for the remainder of your billing cycle. No penalties, no complications.',
  },
  {
    question: 'Is my data safe in the cloud?',
    answer:
      '100%. We use 256-bit encryption, automated daily backups, and comply with GDPR & ISO 27001. Your data is physically more secure in the cloud than on a local server.',
  },
  {
    question: 'What happens after my 14-day trial?',
    answer:
      'You choose a plan that fits your business. No auto-charging—you confirm. If it\'s not right, just cancel. We have a 30-day money-back guarantee, no questions asked.',
  },
  {
    question: 'Do you offer a discount for annual billing?',
    answer:
      'Yes! Pay annually and save 15%. Enterprise plans get custom discounts. Contact our sales team for a personalized quote.',
  },
];

function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <h3 className="text-left font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
        <ChevronDown
          className={`w-5 h-5 text-gray-500 transition-transform flex-shrink-0 ml-4 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{faq.answer}</p>
        </div>
      )}
    </div>
  );
}

export function FAQAndCTASection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      {/* FAQ Section */}
      <section className="w-full py-20 px-4 md:py-32 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Frequently Asked <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">Questions</span>
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Have a question? We have answers. Can&apos;t find what you&apos;re looking for?
            </p>
            <Link href="#" className="text-purple-600 hover:text-purple-700 font-semibold mt-2 inline-block">
              Contact our support team →
            </Link>
          </div>

          {/* FAQ List */}
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                faq={faq}
                isOpen={openIndex === index}
                onToggle={() => setOpenIndex(openIndex === index ? null : index)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="w-full py-20 px-4 md:py-32 bg-gradient-to-r from-purple-600 to-green-600">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Business?
          </h2>
          <p className="text-lg md:text-xl opacity-95 mb-8 leading-relaxed">
            Join over 2,000 stores that use GoodSale every day to streamline operations, increase sales, and make smarter decisions.
          </p>
          <p className="text-lg font-semibold mb-8 opacity-90">
            Start your free trial in 30 seconds. No credit card required.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button
                size="lg"
                className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 font-semibold px-8"
              >
                Start Your Free Trial
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto text-white border-white hover:bg-white/10 font-semibold px-8"
            >
              Schedule a Demo
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 pt-12 border-t border-white/20 space-y-3 text-sm opacity-90">
            <p>⭐ 4.9/5 on Trustpilot from 500+ reviews</p>
            <p>✅ 30-day money-back guarantee • 🔒 Bank-level security</p>
          </div>
        </div>
      </section>
    </>
  );
}
