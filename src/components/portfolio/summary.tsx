import { Card, CardContent } from '@/components/ui/card';
import { Section } from '@/components/portfolio/section';

export function Summary() {
  return (
    <Section id="about" title="About Me">
      <Card className="max-w-3xl mx-auto" variant="glass">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              Backend-focused Software Engineer with strong experience in building, optimizing, and scaling high-traffic systems.

I specialize in .NET Core APIs, Solr, Redis, MSSQL, and Node.js, with hands-on expertise in performance tuning, memory optimization, and load testing using k6 + Grafana.

I’ve worked extensively on complex integrations, handling real-world scenarios like partial failures, retries, callbacks, and high concurrency. My approach is practical and production-first — diagnose fast, fix right, and prevent recurrence.

Passionate about automation, system reliability, and exploring emerging tech like AI-assisted development.
            </p>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}
