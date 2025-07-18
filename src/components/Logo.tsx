import { Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2 font-headline text-xl font-bold text-primary", className)}>
      <Leaf className="h-6 w-6" />
      <span className="dark:text-white">NutriSnap</span>
    </div>
  );
}
