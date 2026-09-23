'use client';

import { Briefcase, Calendar, MapPin } from 'lucide-react';
import { Section } from '@/components/portfolio/section';
import { motion } from 'framer-motion';
import { experience } from '@/data/profile';


export function Experience() {
  return (
    <Section id="experience" title="Current Role" comment="2021 – Present" data={experience}>
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
        <div className="mb-7 grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {experience.highlights.map(({ label, value }) => (
            <div key={label} className="glass-inset p-4">
              <p className="text-sm font-semibold text-primary mb-1">{label}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{value}</p>
            </div>
          ))}
        </div>

        {/* Responsibilities */}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Key contributions
        </p>
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
          className="space-y-2.5"
        >
          {experience.responsibilities.map((item, idx) => (
            <motion.li
              key={idx}
              variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
              className="flex items-start gap-3"
            >
              <span className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="text-[15px] text-foreground/80 leading-relaxed">{item}</span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </Section>
  );
}
