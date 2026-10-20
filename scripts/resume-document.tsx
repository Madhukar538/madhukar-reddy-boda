import path from 'node:path';
import React from 'react';
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import {
  education,
  experience,
  keyProjects,
  profile,
  rdProjects,
  responsibilities,
  skillCategories,
} from '../src/data/profile';

// Never split words across lines (keeps text clean for ATS parsers).
Font.registerHyphenationCallback((word) => [word]);

// The site's Midnight look: a navy header band with the portrait, Inter (the
// site's typeface, embedded and subset, so text stays selectable for ATS
// parsers) and midnight-blue accents. The body stays white so it prints well.
const fontDir = path.join(process.cwd(), 'src/lib/og-fonts');
Font.register({
  family: 'Inter',
  fonts: [
    { src: path.join(fontDir, 'Inter-Regular.ttf'), fontWeight: 400 },
    { src: path.join(fontDir, 'Inter-SemiBold.ttf'), fontWeight: 600 },
    { src: path.join(fontDir, 'Inter-ExtraBold.ttf'), fontWeight: 800 },
  ],
});
const PORTRAIT = path.join(process.cwd(), 'public/icons/icon-192.png');

const NAVY = '#070a12';
const NAVY_2 = '#0f1d3d';
const ACCENT = '#1e4fd6';
const ACCENT_ON_NAVY = '#7cb6ff';
const INK = '#111827';
const MUTED = '#4b5563';
const RULE = '#e5e7eb';

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 40, paddingHorizontal: 0, fontFamily: 'Inter', fontSize: 9, color: INK, lineHeight: 1.4 },
  body: { paddingHorizontal: 40 },
  band: { marginTop: -34, backgroundColor: NAVY, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 22, marginBottom: 6, borderBottomWidth: 3, borderBottomColor: ACCENT },
  photo: { width: 64, height: 64, borderRadius: 32, marginRight: 18, borderWidth: 1.5, borderColor: NAVY_2 },
  name: { fontSize: 23, fontWeight: 800, color: '#f1f5fb', letterSpacing: -0.4, lineHeight: 1.15 },
  title: { fontSize: 11, color: ACCENT_ON_NAVY, fontWeight: 600, marginTop: 3 },
  contact: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, color: '#a9b6cc', fontSize: 8.5 },
  contactItem: { marginRight: 12 },
  link: { color: '#a9b6cc', textDecoration: 'none' },
  section: { marginTop: 11 },
  heading: { fontSize: 9.5, fontWeight: 800, color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 3, marginBottom: 6, borderBottomWidth: 0.75, borderBottomColor: RULE },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  roleTitle: { fontSize: 11, fontWeight: 600 },
  meta: { color: MUTED, fontSize: 9 },
  highlight: { flexDirection: 'row', marginTop: 4 },
  highlightLabel: { width: 78, fontWeight: 600, fontSize: 9 },
  highlightValue: { flex: 1, color: MUTED, fontSize: 9 },
  bullet: { flexDirection: 'row', marginTop: 1.5 },
  dot: { width: 10, color: ACCENT },
  bulletText: { flex: 1 },
  item: { marginBottom: 5 },
  itemTitle: { fontWeight: 600, fontSize: 10 },
  tech: { color: MUTED, fontSize: 8.5, marginTop: 1 },
  skillRow: { flexDirection: 'row', marginBottom: 3 },
  skillLabel: { width: 118, fontWeight: 600, fontSize: 9 },
  skillValue: { flex: 1, fontSize: 9, color: INK },
});

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

export function ResumeDocument() {
  // Keep it to two pages: the newest key projects, plus the newest
  // prototypes and shipped tools from the Lab.
  const projects = keyProjects.slice(0, 6);
  const selectedRnd = [
    ...rdProjects.filter((p) => p.status !== 'SHIPPED').slice(0, 3),
    ...rdProjects.filter((p) => p.status === 'SHIPPED').slice(0, 2),
  ];

  return (
    <Document
      title={`${profile.name} — Résumé`}
      author={profile.name}
      subject={`${profile.title} résumé`}
      keywords=".NET, Software Engineer, RAG, MCP, Next.js, Performance"
    >
      <Page size="A4" style={s.page}>
        {/* Header band, as on the site */}
        <View style={s.band}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={PORTRAIT} style={s.photo} />
          <View style={{ flex: 1 }}>
            <Text style={s.name}>{profile.name}</Text>
            <Text style={s.title}>{profile.title} · {profile.company}</Text>
            <View style={s.contact}>
              <Text style={s.contactItem}>{profile.location}</Text>
              <Link style={[s.contactItem, s.link]} src={`mailto:${profile.email}`}>{profile.email}</Link>
              <Link style={[s.contactItem, s.link]} src={profile.phoneHref}>{profile.phone}</Link>
              <Link style={[s.contactItem, s.link]} src="https://dhucar.in">dhucar.in</Link>
              <Link style={[s.contactItem, s.link]} src={profile.github}>{profile.github.replace('https://', '')}</Link>
            </View>
          </View>
        </View>
        <View style={s.body}>

        <View style={s.section}>
          <Heading>Summary</Heading>
          <Text>{profile.summary}</Text>
        </View>

        <View style={s.section}>
          <Heading>Experience</Heading>
          <View style={s.row}>
            <Text style={s.roleTitle}>{experience.title} — {experience.company}</Text>
            <Text style={s.meta}>{experience.duration} · {experience.location}</Text>
          </View>
          {experience.highlights.map((h) => (
            <View key={h.label} style={s.highlight}>
              <Text style={s.highlightLabel}>{h.label}</Text>
              <Text style={s.highlightValue}>{h.value}</Text>
            </View>
          ))}
          <View style={{ marginTop: 5 }}>
            {responsibilities.map((r) => (
              <Bullet key={r}>{r}</Bullet>
            ))}
          </View>
        </View>

        <View style={s.section}>
          <Heading>Key Projects</Heading>
          {projects.map((p) => (
            <View key={p.title} style={s.item} wrap={false}>
              <Text style={s.itemTitle}>{p.title}</Text>
              <Text>{p.description}</Text>
              <Text style={s.tech}>{p.tech.join(' · ')}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Heading>Selected R&amp;D</Heading>
          {selectedRnd.map((p) => (
            <View key={p.title} style={s.item} wrap={false}>
              <Text style={s.itemTitle}>{p.title}</Text>
              <Text>{p.description}</Text>
              <Text style={s.tech}>{p.tech.join(' · ')}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Heading>Technical Skills</Heading>
          {skillCategories.map((c) => (
            <View key={c.title} style={s.skillRow} wrap={false}>
              <Text style={s.skillLabel}>{c.title}</Text>
              <Text style={s.skillValue}>{c.skills.join(', ')}</Text>
            </View>
          ))}
        </View>

        <View style={s.section} wrap={false}>
          <Heading>Education</Heading>
          <View style={s.row}>
            <Text style={s.itemTitle}>{education.degree} — {education.institution}</Text>
            <Text style={s.meta}>{education.location}</Text>
          </View>
        </View>

        </View>

        {/* Footer on every page */}
        <View fixed style={{ position: 'absolute', bottom: 16, left: 40, right: 40 }}>
          <Text style={{ fontSize: 7.5, color: '#9ca3af', textAlign: 'center' }}>{profile.name} · dhucar.in</Text>
        </View>
      </Page>
    </Document>
  );
}
