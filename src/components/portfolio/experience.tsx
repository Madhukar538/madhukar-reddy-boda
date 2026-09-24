import { Briefcase, Calendar, MapPin } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { clientProjects, experience } from '@/data/profile';

// Year a client engagement started, for ordering the timeline.
const startYear = (duration: string) => Number(duration.match(/\d{4}/)?.[0] ?? 0);

export function Experience() {
  const timeline = [...clientProjects].sort((a, b) => startYear(b.duration) - startYear(a.duration));

  return (
    <>
      <Section id="experience" title="Current Role" comment={experience.duration} data={experience}>
        <div className="glass p-6 md:p-8">
          {/* Role header */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-8px_hsl(var(--primary)/0.7)]">
              <Briefcase className="h-5 w-5" />
            </span>
            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-xl font-bold text-foreground">{experience.title}</h3>
                <span className="chip chip-accent">{experience.type}</span>
              </div>
              <p className="text-[15px] font-medium text-foreground/80">{experience.company}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />{experience.duration}</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{experience.location}</span>
              </div>
            </div>
          </div>

          {/* Highlights */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {experience.highlights.map(({ label, value }) => (
              <div key={label} className="glass-inset p-4">
                <p className="text-sm font-semibold text-primary mb-1">{label}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{value}</p>
              </div>
            ))}
          </div>

          {/* Contributions, grouped */}
          <div className="grid gap-x-8 gap-y-7 md:grid-cols-2">
            {experience.groups.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">{group.label}</p>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span className="text-[15px] text-foreground/80 leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section id="clients" title="Client Timeline" comment="E-commerce portals and integrations" data={timeline}>
        <ol className="relative ml-2 border-l border-foreground/15 space-y-5">
          {timeline.map((project) => (
            <li key={project.id} className="relative pl-6">
              <span className="absolute -left-[5px] top-6 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
              <div className="glass p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <h3 className="text-lg font-bold text-foreground">{project.title}</h3>
                  <span className="text-xs tabular-nums text-muted-foreground">{project.duration}</span>
                </div>
                <p className="mt-0.5 text-sm font-medium text-primary">{project.role}</p>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{project.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
