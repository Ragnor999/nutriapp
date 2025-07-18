import { DashboardClient } from '@/components/DashboardClient';

export default function DashboardPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight font-headline">Dashboard</h1>
      <p className="text-muted-foreground">Get an instant analysis of your meal.</p>
      <div className="mt-6">
        <DashboardClient />
      </div>
    </>
  );
}
