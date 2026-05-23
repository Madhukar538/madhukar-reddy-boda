import { GraduationCap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Section } from '@/components/portfolio/section';

export function Education() {
  return (
    <Section id="education" title="Education">
      <Card className="mx-auto max-w-2xl" variant="glass">
        <CardHeader>
          <div className="flex items-center gap-4">
            <GraduationCap className="h-8 w-8 text-accent" />
            <div>
              <CardTitle className="text-xl font-headline">
                B.Sc in Computer Science
              </CardTitle>
              <p className="text-muted-foreground">
                SATAVAHANA UNIVERSITY
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
