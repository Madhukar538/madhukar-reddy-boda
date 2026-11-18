import { Award as AwardIcon, FileText } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { awards } from '@/data/awards';

/** Awards and nominations, each with a link to its certificate (About page). */
export function Recognition() {
  if (awards.length === 0) return null;
  return (
    <Section id="recognition" title="Recognition" comment="Awards and nominations" data={awards}>
      <div className="grid gap-4 sm:grid-cols-2">
        {awards.map((award) => (
          <div key={award.url} className="award-card glass p-6 md:p-8">
            <div className="flex items-start gap-4">
              <span className="card-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--sys-orange))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-8px_hsl(var(--sys-orange)/0.7)]">
                <AwardIcon className="h-5 w-5" />
              </span>
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[hsl(var(--sys-orange))]">{award.body}</p>
                <h3 className="text-xl font-bold text-foreground">{award.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {award.project} · {award.month}
                </p>
                <a
                  href={award.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" /> View certificate
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
