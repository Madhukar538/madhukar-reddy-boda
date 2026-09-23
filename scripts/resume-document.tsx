import React from 'react';
import { Document, Font, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
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

// Built-in Helvetica keeps the PDF small, text-selectable and ATS-friendly.
const ACCENT = '#0A84FF';
const INK = '#1d1d1f';
const MUTED = '#5f6368';
const RULE = '#e3e3e8';

const s = StyleSheet.create({
  page: { paddingTop: 32, paddingBottom: 36, paddingHorizontal: 40, fontFamily: 'Helvetica', fontSize: 9.25, color: INK, lineHeight: 1.35 },
  name: { fontSize: 24, fontFamily: 'Helvetica-Bold', letterSpacing: -0.3, lineHeight: 1.15 },
  title: { fontSize: 11.5, color: ACCENT, fontFamily: 'Helvetica-Bold', marginTop: 4 },
  contact: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, color: MUTED, fontSize: 9 },
  contactItem: { marginRight: 12 },
  link: { color: MUTED, textDecoration: 'none' },
  accentBar: { height: 2, backgroundColor: ACCENT, width: 44, marginTop: 10, borderRadius: 1 },
  section: { marginTop: 11 },
  heading: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: ACCENT, textTransform: 'uppercase', letterSpacing: 1, paddingBottom: 3, marginBottom: 6, borderBottomWidth: 0.75, borderBottomColor: RULE },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  roleTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
  meta: { color: MUTED, fontSize: 9 },
  highlight: { flexDirection: 'row', marginTop: 4 },
  highlightLabel: { width: 78, fontFamily: 'Helvetica-Bold', fontSize: 9 },
  highlightValue: { flex: 1, color: MUTED, fontSize: 9 },
  bullet: { flexDirection: 'row', marginTop: 1.5 },
  dot: { width: 10, color: ACCENT },
  bulletText: { flex: 1 },
  item: { marginBottom: 5 },
  itemTitle: { fontFamily: 'Helvetica-Bold', fontSize: 10 },
  tech: { color: MUTED, fontSize: 8.5, marginTop: 1 },
  skillRow: { flexDirection: 'row', marginBottom: 3 },
  skillLabel: { width: 118, fontFamily: 'Helvetica-Bold', fontSize: 9 },
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
      keywords=".NET, Software Architect, RAG, MCP, Next.js, Performance"
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <Text style={s.name}>{profile.name}</Text>
        <Text style={s.title}>{profile.title} · {profile.company}</Text>
        <View style={s.contact}>
          <Text style={s.contactItem}>{profile.location}</Text>
          <Link style={[s.contactItem, s.link]} src={`mailto:${profile.email}`}>{profile.email}</Link>
          <Link style={[s.contactItem, s.link]} src={profile.phoneHref}>{profile.phone}</Link>
          <Link style={[s.contactItem, s.link]} src={profile.github}>{profile.github.replace('https://', '')}</Link>
        </View>
        <View style={s.accentBar} />

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
            {experience.responsibilities.map((r) => (
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

      </Page>
    </Document>
  );
}
