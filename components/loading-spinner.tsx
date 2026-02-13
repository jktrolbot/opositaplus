import { Loader2 } from 'lucide-react';

export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={`flex min-h-[40vh] items-center justify-center ${className ?? ''}`}>
      <Loader2 className="h-6 w-6 animate-spin text-[#1B3A5C]" />
    </div>
  );
}
