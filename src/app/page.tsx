import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GoodSaleLogo } from '@/components/goodsale-logo';
import { ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
            <GoodSaleLogo className="inline-flex" />
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                The All-in-One Inventory & Point-of-Sale solution for modern businesses.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="transform hover:scale-105 transition-transform duration-300">
                <CardHeader>
                    <CardTitle className="font-headline">For Shop Owners & Staff</CardTitle>
                    <CardDescription>
                        Access your shop's dashboard to manage products, sales, and more.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/login">
                        <Button className="w-full" variant="default">
                            Tenant Login <ArrowRight className="ml-2" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            <Card className="transform hover:scale-105 transition-transform duration-300">
                <CardHeader>
                    <CardTitle className="font-headline">For Super Admins</CardTitle>
                    <CardDescription>
                        Manage tenants, subscriptions, and the entire GoodSale platform.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/admin/dashboard">
                        <Button className="w-full" variant="secondary">
                           Admin Panel <ArrowRight className="ml-2" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} GoodSale. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
