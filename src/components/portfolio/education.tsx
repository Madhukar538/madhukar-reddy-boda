import { GraduationCap } from 'lucide-react';
import { Section } from '@/components/portfolio/section';

export function Education() {
  return (
    <Section id="education" title="education()" comment="Academic background">
      <div className="terminal-card p-6 md:p-8">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-sm shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-1.5">
            <p className="font-mono text-xs text-muted-foreground/60">{'// degree'}</p>
            <h3 className="font-mono text-base font-bold text-foreground">
              B.Sc in Computer Science
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground">
              <span className="text-primary/80">Satavahana University</span>
              <span>{'>'} Karimnagar, Telangana</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed pt-1 max-w-xl">
              Graduated with a Bachelor of Science degree, focusing on core computer
              science principles, data structures, algorithms, and software development fundamentals.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
