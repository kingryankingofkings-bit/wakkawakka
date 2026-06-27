import { cn } from '@/lib/utils';

export function Spinner({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' };
  return (
    <div className={cn('animate-spin rounded-full border-primary border-t-transparent', sizes[size], className)} />
  );
}

export function PageSpinner() {
  return (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
