import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoodSaleLogo } from '@/components/goodsale-logo';
import {
  ArrowRight,
  BarChart3,
  ShoppingCart,
  Users,
  Zap,
  Lock,
  Smartphone,
  CheckCircle,
} from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: ShoppingCart,
      title: 'Point-of-Sale',
      description: 'Fast, intuitive checkout system with multiple payment methods',
    },
    {
      icon: BarChart3,
      title: 'Inventory Management',
      description: 'Real-time stock tracking and automated reorder alerts',
    },
    {
      icon: Users,
      title: 'Multi-User Support',
      description: 'Manage multiple staff accounts with role-based permissions',
    },
    {
      icon: Zap,
      title: 'Sales Analytics',
      description: 'Detailed reports and insights into your business performance',
    },
    {
      icon: Lock,
      title: 'Secure & Reliable',
      description: 'Enterprise-grade security and 99.9% uptime guarantee',
    },
    {
      icon: Smartphone,
      title: 'Mobile Ready',
      description: 'Fully responsive design works on any device',
    },
  ];

  const faqs = [
    {
      question: 'How much does GoodSale cost?',
      answer:
        'We offer flexible pricing starting from GH₵199/month for startups up to GH₵999/month for enterprises. All plans can be purchased on a monthly, 6-month, 12-month, or 24-month basis with volume discounts available.',
    },
    {
      question: 'Can I try GoodSale for free?',
      answer:
        'Yes! Contact our sales team to arrange a personalized demo and trial period for your business.',
    },
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept cash payments (for face-to-face meetings), bank transfers, mobile money, and card payments. Annual subscriptions receive special discounts.',
    },
    {
      question: 'Is my data safe?',
      answer:
        'Absolutely! All data is encrypted and stored securely on compliant servers. We perform regular security audits and maintain daily backups.',
    },
    {
      question: 'Do you provide support?',
      answer:
        'Yes, we offer 24/7 email support and phone support during business hours. Premium plans include dedicated account management.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer:
        'Yes, subscriptions can be cancelled anytime. For annual or multi-year plans, we pro-rate refunds based on remaining time.',
    },
  ];

  return (
    <main className="flex min-h-screen flex-col bg-background">
      {/* Hero Section */}
      <section className="w-full py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <GoodSaleLogo className="inline-flex mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">The All-in-One POS & Inventory Solution</h1>
          <p className="text-xl text-blue-100 mb-8">
            Streamline your retail operations with powerful tools designed for modern businesses.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="gap-2 text-white border-white hover:bg-blue-700">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Powerful Features for Your Business</h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to run a successful retail operation
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <Icon className="w-8 h-8 text-blue-600 mb-2" />
                    <CardTitle className="font-headline">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="w-full py-20 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-lg">No hidden fees. No surprises. Cancel anytime.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {['Starter', 'Professional', 'Enterprise'].map((plan, index) => (
              <Card key={index} className={index === 1 ? 'border-blue-600 border-2' : ''}>
                <CardHeader>
                  <CardTitle className="font-headline">{plan}</CardTitle>
                  <CardDescription>
                    {index === 0 && 'For small shops'}
                    {index === 1 && 'Most popular'}
                    {index === 2 && 'For large operations'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-bold">
                      GH₵{index === 0 ? '199' : index === 1 ? '499' : '999'}
                      <span className="text-sm text-muted-foreground font-normal">/month</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {index === 0 && 'Up to 1 user'}
                      {index === 1 && 'Up to 5 users'}
                      {index === 2 && 'Unlimited users'}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {[
                      'POS System',
                      'Inventory Management',
                      'Sales Reports',
                      index >= 1 && 'Multi-user Support',
                      index >= 2 && 'Priority Support',
                    ]
                      .filter(Boolean)
                      .map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                  </ul>
                  <Link href="/signup" className="w-full">
                    <Button className="w-full" variant={index === 1 ? 'default' : 'outline'}>
                      Get Started
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-8">
            📅 Annual plans get 20% discount | 📊 24-month plans get 28% discount
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="w-full py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg font-headline">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full py-20 px-4 bg-blue-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of retailers already using GoodSale to grow their sales.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/signup">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="gap-2 text-white border-white hover:bg-blue-700">
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 px-4 border-t text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} GoodSale. All rights reserved.</p>
        <div className="mt-4 flex gap-6 justify-center text-xs">
          <Link href="#" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-foreground">
            Terms of Service
          </Link>
          <Link href="#" className="hover:text-foreground">
            Contact Us
          </Link>
        </div>
      </footer>
    </main>
  );
}
