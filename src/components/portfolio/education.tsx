import { GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Section } from '@/components/portfolio/section';

export function Education() {
  return (
    <Section id="education" title="Education">
      <Card className="mx-auto max-w-3xl overflow-hidden border border-border/60 bg-card/70 shadow-2xl" variant="glass">
        <div className="h-1 w-full bg-gradient-to-r from-accent via-primary to-transparent opacity-80" />
        <CardHeader>
          <div className="flex items-center gap-4">
            <GraduationCap className="h-8 w-8 text-accent" />
            <div>
              <CardTitle className="text-xl font-headline">
                B.Sc in Computer Science
              </CardTitle>
              <p className="text-muted-foreground">
                Satavahana University
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Graduated with a Bachelor of Science degree, focusing on core computer science principles and software development fundamentals.
          </p>
        </CardContent>
      </Card>
    </Section>
  );
}
