/**
 * Exports the site's built-in content to backend/seed/content.json, which the
 * .NET API imports into an empty MongoDB on first start (see SeedBAL).
 * Run: npx tsx --tsconfig tsconfig.json scripts/export-content.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { blogs } from '../src/data/blogs';
import { clientProjects, education, experience, keyProjects, profile, rdProjects, skillCategories } from '../src/data/profile';
import { anchorId } from '../src/lib/utils';

let order = 0;
const projects = [
  ...keyProjects.map((p) => ({
    id: anchorId(p.title), kind: 'key', title: p.title, description: p.description, tech: p.tech,
    post: p.post ?? '', isFeatured: !!p.featured, outcome: p.outcome ?? '', sortOrder: order++,
  })),
  ...clientProjects.map((p) => ({
    id: anchorId(p.title), kind: 'client', title: p.title, description: p.description, tech: p.tech,
    client: p.client, role: p.role, duration: p.duration, url: p.url ?? '', responsibilities: p.responsibilities, sortOrder: order++,
  })),
  ...rdProjects.map((p) => ({
    id: anchorId(p.title), kind: 'lab', title: p.title, description: p.description, tech: p.tech,
    post: p.post ?? '', status: p.status, sortOrder: order++,
  })),
];

const content = {
  posts: blogs.map(({ slug, title, excerpt, content, date, category, tags }) => ({ slug, title, excerpt, content: content.trim(), date, category, tags })),
  projects,
  profile: {
    ...profile,
    skillCategories: skillCategories.map((c) => ({ title: c.title, color: c.color ?? 'green', skills: c.skills })),
    experience: {
      title: experience.title, company: experience.company, duration: experience.duration, location: experience.location, type: experience.type,
      highlights: experience.highlights, groups: experience.groups,
    },
    education,
  },
};

mkdirSync('backend/seed', { recursive: true });
writeFileSync('backend/seed/content.json', JSON.stringify(content, null, 2) + '\n');
console.log(`Exported ${content.posts.length} posts, ${projects.length} projects and the profile.`);
