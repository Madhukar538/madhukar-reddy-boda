import { MapPin } from 'lucide-react';

/**
 * Name, role and city above the Midnight hero headline (Midnight replaces the
 * small avatar row with the big portrait, so the name needs to stand on its own).
 */
export function HeroIdentity({ className = '' }: { className?: string }) {
  return (
    <div className={`portrait-only ${className}`}>
      <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Boda Madhukar Reddy</p>
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-base sm:text-lg text-muted-foreground">
        <span className="font-medium text-primary">Software Architect</span>
        <span aria-hidden>·</span>
        <span className="inline-flex items-center gap-1">
          <MapPin aria-hidden className="h-4 w-4" /> Hyderabad, India
        </span>
      </p>
    </div>
  );
}
