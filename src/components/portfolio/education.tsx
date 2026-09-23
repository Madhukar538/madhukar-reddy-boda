import { GraduationCap, MapPin } from 'lucide-react';
import { Section } from '@/components/portfolio/section';

const educationData = {
  degree: 'B.Sc in Computer Science',
  institution: 'Satavahana University',
  location: 'Karimnagar, Telangana',
  description: 'Graduated with a Bachelor of Science degree, focusing on core computer science principles, data structures, algorithms, and software development fundamentals.'
};

export function Education() {
  return (
    <Section id="education" title="Education" comment="Academic background" data={educationData}>
      <div className="glass p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--sys-indigo))] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.4),0_8px_20px_-8px_hsl(var(--sys-indigo)/0.7)]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="space-y-1.5">
            <h3 className="text-xl font-bold text-foreground">{educationData.degree}</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-primary">{educationData.institution}</span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                {educationData.location}
              </span>
            </div>
            <p className="text-[15px] text-muted-foreground leading-relaxed pt-1 max-w-xl">
              {educationData.description}
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
