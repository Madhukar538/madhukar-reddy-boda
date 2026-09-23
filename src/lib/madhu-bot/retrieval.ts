import { blogs } from '@/data/blogs';
import { experience, keyProjects, profile, rdProjects, skillCategories } from '@/data/profile';
import { htmlToText } from '@/lib/portfolio-text';

/**
 * Madhu-bot retrieval: a BM25 index over everything the portfolio says.
 * Deliberately transparent: every score and matched term is returned so
 * the UI can show exactly why each passage was picked.
 */

export type Chunk = {
  id: string;
  kind: 'post' | 'project' | 'lab' | 'experience' | 'profile' | 'skills';
  title: string;
  href: string;
  text: string;
};

export type Hit = {
  rank: number;
  chunk: Chunk;
  score: number;
  matched: string[];
};

const STOPWORDS = new Set(
  ('a an and are as at be by did do does for from has have he her his how i in is it its me my of on or ' +
    'our so than that the their them then there these they this to was we were what when where which who ' +
    'why will with you your about any can could should would into over also just more most very much many ' +
    'tell show give madhukar madhu him').split(' ')
);

// Question words that say little about the topic; they still count, but weakly.
export const GENERIC = new Set(
  'know knows knew work worked working experience experienced built build building use used using good done like make made doe think best way thing kind type'.split(' ')
);

// Tech names that look plural but aren't.
const NO_STEM = new Set(['kubernetes', 'redis', 'postgres', 'jenkins', 'analytics', 'aws', 'ios', 'cors', 'https', 'dns', 'nodejs', 'ms', 'js']);

function stem(t: string) {
  if (NO_STEM.has(t) || t.length <= 4) return t;
  if (t.endsWith('ies')) return `${t.slice(0, -3)}y`;
  if (t.endsWith('s') && !/(ss|us|is)$/.test(t)) return t.slice(0, -1);
  return t;
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9#+.\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ''))
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
    .map(stem);
}

function splitLong(text: string, max = 1100): string[] {
  if (text.length <= max) return [text];
  const parts: string[] = [];
  let current = '';
  for (const para of text.split(/\n\n+/)) {
    if (current && current.length + para.length > max) {
      parts.push(current.trim());
      current = '';
    }
    current += `${para}\n\n`;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  chunks.push({
    id: 'profile',
    kind: 'profile',
    title: 'Profile',
    href: '/about',
    text:
      `${profile.name} is a ${profile.title} at ${profile.company} in ${profile.location}. ${profile.summary} ` +
      'Currently working at Revalsys Technologies and open to fixing bugs and giving solutions. ' +
      `Contact: ${profile.email}.`,
  });

  chunks.push({
    id: 'experience',
    kind: 'experience',
    title: `${experience.title} at ${experience.company} (${experience.duration})`,
    href: '/experience',
    text: [
      ...experience.highlights.map((h) => `${h.label}: ${h.value}.`),
      ...experience.responsibilities,
    ].join('\n'),
  });

  skillCategories.forEach((c) =>
    chunks.push({ id: `skills:${c.title}`, kind: 'skills', title: `Skills: ${c.title}`, href: '/about#skills', text: `${c.title}: ${c.skills.join(', ')}.` })
  );

  keyProjects.forEach((p) =>
    chunks.push({
      id: `project:${p.title}`,
      kind: 'project',
      title: p.title,
      href: p.post ? `/blog/${p.post}` : '/projects',
      text: `${p.title}. ${p.description} Tech: ${p.tech.join(', ')}.`,
    })
  );

  rdProjects.forEach((p) =>
    chunks.push({
      id: `lab:${p.title}`,
      kind: 'lab',
      title: `${p.title} (Lab, ${p.status.toLowerCase()})`,
      href: p.post ? `/blog/${p.post}` : '/lab',
      text: `${p.title}. ${p.description} Tech: ${p.tech.join(', ')}.`,
    })
  );

  blogs.forEach((post) => {
    // htmlToText yields the intro first, then "## Heading" sections.
    const [intro, ...sections] = htmlToText(post.content).split(/\n## /);
    const parts = [
      { heading: 'Introduction', text: intro },
      ...sections.map((s) => {
        const [heading, ...rest] = s.split('\n');
        return { heading: heading.trim(), text: rest.join('\n') };
      }),
    ];
    parts.forEach(({ heading, text }, si) => {
      splitLong(text.trim()).forEach((part, pi) =>
        chunks.push({
          id: `post:${post.slug}:${si}:${pi}`,
          kind: 'post',
          title: `${post.title} › ${heading}`,
          href: `/blog/${post.slug}`,
          text: part,
        })
      );
    });
  });

  return chunks.filter((c) => c.text.trim().length > 40);
}

type Index = {
  chunks: Chunk[];
  termFreqs: Map<string, number>[];
  lengths: number[];
  avgLength: number;
  docFreq: Map<string, number>;
};

let cached: Index | null = null;

function index(): Index {
  if (cached) return cached;
  const chunks = buildChunks();
  const termFreqs = chunks.map((c) => {
    const tf = new Map<string, number>();
    // Titles count double: they summarise what the passage is about.
    [...tokenize(c.title), ...tokenize(c.title), ...tokenize(c.text)].forEach((t) => tf.set(t, (tf.get(t) ?? 0) + 1));
    return tf;
  });
  const lengths = termFreqs.map((tf) => [...tf.values()].reduce((a, b) => a + b, 0));
  const docFreq = new Map<string, number>();
  termFreqs.forEach((tf) => tf.forEach((_, t) => docFreq.set(t, (docFreq.get(t) ?? 0) + 1)));
  cached = { chunks, termFreqs, lengths, avgLength: lengths.reduce((a, b) => a + b, 0) / lengths.length, docFreq };
  return cached;
}

const K1 = 1.2;
const B = 0.75;

export type Retrieval = {
  terms: string[];
  /** Topic terms that appear nowhere in the portfolio (e.g. "rust"). */
  unknown: string[];
  hits: Hit[];
  corpusSize: number;
};

export function retrieve(question: string, k = 5): Retrieval {
  const { chunks, termFreqs, lengths, avgLength, docFreq } = index();
  const terms = Array.from(new Set(tokenize(question)));
  const N = chunks.length;

  const scored = chunks.map((chunk, i) => {
    let score = 0;
    const matched: string[] = [];
    for (const term of terms) {
      const f = termFreqs[i].get(term) ?? 0;
      if (!f) continue;
      matched.push(term);
      const df = docFreq.get(term) ?? 0;
      const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
      const weight = GENERIC.has(term) ? 0.25 : 1;
      score += weight * idf * ((f * (K1 + 1)) / (f + K1 * (1 - B + (B * lengths[i]) / avgLength)));
    }
    return { chunk, score, matched };
  });

  const topical = terms.filter((t) => !GENERIC.has(t));
  // Unknown = not in the index even as a word stem ("tune" is known via "tuning").
  const vocabulary = [...docFreq.keys()];
  const unknown = topical.filter(
    (t) => !docFreq.has(t) && !(t.length >= 4 && vocabulary.some((v) => v.startsWith(t) || (v.length >= 4 && t.startsWith(v))))
  );
  const hits = scored
    // A passage must match at least one topical term, not just "know" or "experience".
    .filter((s) => s.score > 0 && (topical.length === 0 || s.matched.some((m) => !GENERIC.has(m))))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s, i) => ({ rank: i + 1, chunk: s.chunk, score: Math.round(s.score * 100) / 100, matched: s.matched }));

  return { terms, unknown, hits, corpusSize: N };
}
