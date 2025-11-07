'use client';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Edit, PlusCircle, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/types";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface PlanWithId extends Plan { id?: string }

export default function PlansClient({ initialPlans }: { initialPlans: PlanWithId[] }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanWithId[]>(initialPlans || []);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [isDeletingPlan, setIsDeletingPlan] = useState<string | null>(null);
  const [planToEdit, setPlanToEdit] = useState<PlanWithId | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (!session?.user.isSuperAdmin) return;
    if ((initialPlans?.length || 0) > 0) return;

    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const response = await fetch('/api/admin/plans');
        if (!response.ok) throw new Error('Failed to fetch plans');
        const data = await response.json();
        const normalized = (Array.isArray(data) ? data : []).map((p: any) => ({
          ...p,
          features: Array.isArray(p?.features)
            ? p.features
            : (typeof p?.features === 'string'
                ? (() => { try { const parsed = JSON.parse(p.features); return Array.isArray(parsed) ? parsed : p.features.split('\n').filter((x: string) => x.trim()); } catch { return p.features.split('\n').filter((x: string) => x.trim()); } })()
                : []),
        }));
        setPlans(normalized);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to load plans' });
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchPlans();
  }, [session?.user.isSuperAdmin, toast, initialPlans]);

  const openEditDialog = (plan: PlanWithId) => {
    setPlanToEdit(plan);
    setIsEditDialogOpen(true);
  };

  const handleEditPlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!planToEdit) return;
    setIsEditingPlan(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const features = (formData.get("features") as string).split('\n').filter(f => f.trim() !== '');

    try {
      const response = await fetch(`/api/admin/plans/${planToEdit.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, description, features }),
      });

      if (!response.ok) throw new Error('Failed to update plan');

      const updated = await response.json();
      setPlans(plans.map(p => p.id === planToEdit.id ? updated : p));
      setIsEditDialogOpen(false);
      setPlanToEdit(null);
      toast({ title: "Plan Updated", description: `"${name}" has been successfully updated.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to update plan' });
    } finally {
      setIsEditingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    setIsDeletingPlan(planId);
    try {
      const response = await fetch(`/api/admin/plans/${planId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete plan');
      setPlans(plans.filter(p => p.id !== planId));
      toast({ variant: 'destructive', title: 'Plan Deleted', description: `"${planName}" has been deleted.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to delete plan' });
    } finally {
      setIsDeletingPlan(null);
    }
  };

  const handleAddPlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsAddingPlan(true);
    const form = event.currentTarget;

    const formData = new FormData(form);
    const name = formData.get("name") as string;
    const price = formData.get("price") as string;
    const description = formData.get("description") as string;
    const features = (formData.get("features") as string).split('\n').filter(f => f.trim() !== '');

    try {
      const response = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, description, features }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create plan');
      }
      const newPlan = await response.json();
      setPlans([...plans, newPlan]);
      form.reset();
      setIsAddDialogOpen(false);
      toast({ title: "Plan Added", description: `The "${name}" plan has been created.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: error instanceof Error ? error.message : 'Failed to create plan' });
    } finally {
      setIsAddingPlan(false);
    }
  };

  return (
    <div>
      <PageHeader title="Subscription Plans" description="Manage subscription plans for tenants.">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-7 gap-1">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Plan</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Plan</DialogTitle>
              <DialogDescription>
                Create a new subscription plan for tenants.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddPlan} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Plan Name</Label>
                <Input id="add-name" name="name" placeholder="e.g., Professional" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-price">Price</Label>
                <Input id="add-price" name="price" placeholder="e.g., GH₵199 or Custom" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-description">Description</Label>
                <Input id="add-description" name="description" placeholder="A short description for the plan." required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-features">Features (one per line)</Label>
                <Textarea id="add-features" name="features" placeholder={'Feature one\nFeature two\nFeature three'} rows={5} required />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Create Plan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => (
          <Card key={plan.name} className={cn("flex flex-col", plan.isCurrent && "border-primary ring-2 ring-primary")}>
            <CardHeader>
              <CardTitle className="font-headline">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4">
              <div>
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.price !== "Custom" && <span className="text-muted-foreground">/month</span>}
              </div>
              <ul className="space-y-2 text-sm">
                {(Array.isArray(plan.features) ? plan.features : []).map((feature) => (
                  <li key={String(feature)} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{String(feature)}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="gap-2">
              <Button variant="outline" className="flex-1" onClick={() => openEditDialog(plan)} disabled={isEditingPlan || isDeletingPlan === plan.id}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="outline" size="icon" onClick={() => plan.id && handleDeletePlan(plan.id, plan.name)} disabled={isDeletingPlan === plan.id}>
                {isDeletingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Plan: {planToEdit?.name}</DialogTitle>
            <DialogDescription>Update the details for this subscription plan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditPlan} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input id="name" name="name" defaultValue={planToEdit?.name} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" defaultValue={planToEdit?.price} placeholder="e.g., GH₵99 or Custom" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" name="description" defaultValue={planToEdit?.description} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea id="features" name="features" defaultValue={Array.isArray(planToEdit?.features) ? planToEdit?.features.join('\n') : ''} rows={5} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
