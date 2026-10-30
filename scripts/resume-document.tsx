import path from 'node:path';
import React from 'react';
import { Circle, Document, Font, Image, Line, Link, Page, Path, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import {
  education,
  experience,
  keyProjects,
  profile,
  rdProjects,
  skillCategories,
} from '../src/data/profile';

// Never split words across lines (keeps text clean for ATS parsers).
Font.registerHyphenationCallback((word) => [word]);

// Two columns, like the common modern résumé builders, and still ATS-safe:
// standard section names, real selectable text (no text in images), no tables,
// and a reading order a parser follows: header, then the left column
// (experience, projects), then the right (summary, skills, education).
// The icons are vector shapes beside the text, never in place of it; the
// portrait comes after the name, so parsers (which skip images) lose nothing.
const fontDir = path.join(process.cwd(), 'src/lib/og-fonts');
Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontDir, 'Inter-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontDir, 'Inter-SemiBold.ttf'), fontWeight: 600 },
    { src: path.join(fontDir, 'Inter-ExtraBold.ttf'), fontWeight: 800 },
  ],
});

// The black t-shirt portrait, square (public/madhukar.png).
const PORTRAIT = path.join(process.cwd(), 'public/madhukar.png');

const INK = '#16120f';
const MUTED = '#5a524b';
const ACCENT = '#a8323b'; // the site's crimson, darkened for print
const RULE = '#d9d3cc';
const TAG_RULE = '#b9b1a8';

const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 38, paddingHorizontal: 36, fontFamily: 'Inter', fontSize: 8.8, color: INK, lineHeight: 1.35 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  photo: { width: 78, height: 78, borderRadius: 39, marginLeft: 16 },
  name: { fontSize: 23, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.2, lineHeight: 1.1 },
  headline: { fontSize: 10.5, fontWeight: 600, color: ACCENT, marginTop: 3 },
  contactRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  contactItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginTop: 2 },
  contactText: { fontSize: 8.5, color: INK, textDecoration: 'none' },
  columns: { flexDirection: 'row' },
  left: { width: '61%', paddingRight: 16 },
  right: { width: '39%' },
  section: { marginBottom: 10 },
  heading: {
    fontSize: 11,
    fontWeight: 800,
    textTransform: 'uppercase',
    paddingBottom: 2,
    marginBottom: 6,
    borderBottomWidth: 1.6,
    borderBottomColor: INK,
  },
  roleTitle: { fontSize: 10, fontWeight: 600 },
  company: { fontSize: 9.3, fontWeight: 600, color: ACCENT, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2, marginBottom: 2 },
  metaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12 },
  meta: { fontSize: 8.3, color: MUTED },
  group: { fontSize: 9, fontWeight: 600, marginTop: 5 },
  bullet: { flexDirection: 'row', marginTop: 1.5 },
  dot: { width: 8 },
  bulletText: { flex: 1 },
  divider: { borderBottomWidth: 0.6, borderBottomColor: RULE, borderStyle: 'dashed', marginVertical: 6 },
  itemTitle: { fontSize: 9.6, fontWeight: 600 },
  result: { marginTop: 1.5 },
  tech: { color: MUTED, fontSize: 8.3, marginTop: 1.5 },
  skillGroup: { fontSize: 9, fontWeight: 600, color: ACCENT, marginTop: 4, marginBottom: 3 },
  tags: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { fontSize: 8.3, fontWeight: 600, marginRight: 7, marginBottom: 5, paddingBottom: 1.5, borderBottomWidth: 0.8, borderBottomColor: TAG_RULE },
  footer: { position: 'absolute', bottom: 16, left: 36, right: 36 },
  footerText: { fontSize: 7.5, color: '#8a827a', textAlign: 'center' },
});

/** Small line icons (Lucide shapes), drawn as vectors next to their text. */
type IconName = 'phone' | 'mail' | 'link' | 'pin' | 'calendar' | 'globe';
function Icon({ name, size = 8.5, color = ACCENT }: { name: IconName; size?: number; color?: string }) {
  const stroke = { stroke: color, strokeWidth: 2.2, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg viewBox="0 0 24 24" style={{ width: size, height: size, marginRight: 3 }}>
      {name === 'phone' && (
        <Path {...stroke} d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
      )}
      {name === 'mail' && (
        <>
          <Rect {...stroke} x="2" y="4" width="20" height="16" rx="2" />
          <Path {...stroke} d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </>
      )}
      {name === 'link' && (
        <>
          <Path {...stroke} d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <Path {...stroke} d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </>
      )}
      {name === 'pin' && (
        <>
          <Path {...stroke} d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <Circle {...stroke} cx="12" cy="10" r="3" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <Rect {...stroke} x="3" y="4" width="18" height="18" rx="2" />
          <Line {...stroke} x1="16" y1="2" x2="16" y2="6" />
          <Line {...stroke} x1="8" y1="2" x2="8" y2="6" />
          <Line {...stroke} x1="3" y1="10" x2="21" y2="10" />
        </>
      )}
      {name === 'globe' && (
        <>
          <Circle {...stroke} cx="12" cy="12" r="10" />
          <Path {...stroke} d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </>
      )}
    </Svg>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={s.bullet} wrap={false}>
      <Text style={s.dot}>•</Text>
      <Text style={s.bulletText}>{children}</Text>
    </View>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={s.heading} minPresenceAhead={40}>{children}</Text>;
}

/** "https://www.linkedin.com/in/x" → "linkedin.com/in/x". */
const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export function ResumeDocument() {
  // Two pages: the newest key projects, then two Lab research projects.
  const projects = keyProjects.slice(0, 4);
  // Research only: the shipped Lab tools (MongoDB tuning, k6 suites) are already in Experience.
  const selectedRnd = rdProjects.filter((p) => p.status !== 'SHIPPED').slice(0, 2);
  // "Ollama · Qwen3 · Gemma" is three skills: split it, so each is its own tag (and keyword).
  const skillTags = (skills: string[]) => skills.flatMap((x) => x.split(' · '));
  const keywords = [...new Set(skillCategories.flatMap((c) => skillTags(c.skills)))].join(', ');
  const contacts: { icon: IconName; text: string; href?: string }[] = [
    { icon: 'phone', text: profile.phone, href: profile.phoneHref },
    { icon: 'mail', text: profile.email, href: `mailto:${profile.email}` },
    ...(profile.linkedin ? [{ icon: 'link' as const, text: bare(profile.linkedin), href: profile.linkedin }] : []),
    { icon: 'globe', text: 'dhucar.in', href: 'https://dhucar.in' },
    { icon: 'link', text: bare(profile.github), href: profile.github },
    { icon: 'pin', text: profile.location },
  ];

  return (
    <Document
      title={`${profile.name} — ${profile.title} — Résumé`}
      author={profile.name}
      subject={`${profile.title} résumé`}
      keywords={keywords}
      creator={profile.name}
      producer="dhucar.in"
    >
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{profile.name}</Text>
            <Text style={s.headline}>{experience.title} | .NET and Self-Hosted AI | Problem Solving</Text>
            <View style={s.contactRow}>
              {contacts.map((c) => (
                <View key={c.text} style={s.contactItem}>
                  <Icon name={c.icon} />
                  {c.href ? <Link style={s.contactText} src={c.href}>{c.text}</Link> : <Text style={s.contactText}>{c.text}</Text>}
                </View>
              ))}
            </View>
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={PORTRAIT} style={s.photo} />
        </View>

        <View style={s.columns}>
          {/* Left: experience and projects. */}
          <View style={s.left}>
            <View style={s.section}>
              <Heading>Work Experience</Heading>
              <Text style={s.roleTitle}>{experience.title}</Text>
              <Text style={s.company}>{experience.company}</Text>
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Icon name="calendar" color={MUTED} size={8} />
                  <Text style={s.meta}>{experience.duration}</Text>
                </View>
                <View style={s.metaItem}>
                  <Icon name="pin" color={MUTED} size={8} />
                  <Text style={s.meta}>{experience.location} ({experience.type})</Text>
                </View>
              </View>
              {experience.groups.map((g) => (
                <View key={g.label}>
                  {/* The label never ends a page alone: it travels with its first bullet. */}
                  <View wrap={false}>
                    <Text style={s.group}>{g.label}</Text>
                    <Bullet>{g.items[0]}</Bullet>
                  </View>
                  {g.items.slice(1).map((item) => (
                    <Bullet key={item}>{item}</Bullet>
                  ))}
                </View>
              ))}
            </View>

            <View style={s.section}>
              {projects.map((p, i) => (
                // The heading travels with the first project, so it never ends a page alone.
                <View key={p.title} wrap={false}>
                  {i === 0 ? <Heading>Projects</Heading> : <View style={s.divider} />}
                  <Text style={s.itemTitle}>{p.title}</Text>
                  <Text>{p.description}</Text>
                  {p.outcome && (
                    <Text style={s.result}>
                      <Text style={{ fontWeight: 600 }}>Result: </Text>
                      {p.outcome}
                    </Text>
                  )}
                  <Text style={s.tech}>Technologies: {p.tech.join(', ')}</Text>
                </View>
              ))}
            </View>

            <View style={s.section}>
              {selectedRnd.map((p, i) => (
                <View key={p.title} wrap={false}>
                  {i === 0 ? <Heading>Research</Heading> : <View style={s.divider} />}
                  <Text style={s.itemTitle}>{p.title}</Text>
                  <Text>{p.description}</Text>
                  <Text style={s.tech}>Technologies: {p.tech.join(', ')}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right: summary, skills, education. */}
          <View style={s.right}>
            <View style={s.section}>
              <Heading>Summary</Heading>
              <Text>{profile.summary}</Text>
            </View>

            <View style={s.section}>
              <Heading>Skills</Heading>
              {skillCategories.map((c) => (
                <View key={c.title} wrap={false}>
                  <Text style={s.skillGroup}>{c.title}</Text>
                  <View style={s.tags}>
                    {skillTags(c.skills).map((skill) => (
                      <Text key={skill} style={s.tag}>
                        {skill}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <View style={s.section} wrap={false}>
              <Heading>Education</Heading>
              <Text style={s.itemTitle}>{education.degree}</Text>
              <Text style={s.company}>{education.institution}</Text>
              <View style={s.metaRow}>
                <View style={s.metaItem}>
                  <Icon name="pin" color={MUTED} size={8} />
                  <Text style={s.meta}>{education.location}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        <View fixed style={s.footer}>
          <Text style={s.footerText}>{profile.name} | Résumé | dhucar.in</Text>
        </View>
      </Page>
    </Document>
  );
}
