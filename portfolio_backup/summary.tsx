import { Card, CardContent } from '@/components/ui/card';
import { Section } from '@/components/portfolio/section';

export function Summary() {
  return (
    <Section id="about" title="About Me">
      <Card className="max-w-3xl mx-auto" variant="glass">
        <CardContent className="pt-6">
          <div className="text-center">
            <p className="text-muted-foreground leading-relaxed text-base md:text-lg">
              Seasoned Software Architect with 4+ years of experience in .NET-based system architecture, delivering scalable, API-driven platforms across domains. Proven expertise in building hybrid IoT and web solutions, modernizing legacy stacks, and integrating AI workflows using Lang Chain, RAG, and Transformer models for intelligent automation and retrieval.
            </p>
          </div>
        </CardContent>
      </Card>
    </Section>
  );
}
