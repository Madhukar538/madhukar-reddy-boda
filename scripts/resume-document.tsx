import path from 'node:path';
import React from 'react';
import { Document, Font, Image, Link, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
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

// ATS-first: one column, standard section names, no tables, no text in images,
// no light-on-dark. The portrait sits to the right of the name, after it in
// reading order, so parsers (which skip images) read the header as plain text. Everything is real, selectable text in
// reading order, with links written out in full so they survive as plain text.
// The site shows only in the details: Inter, ink on white, and the collar
// crimson on the section headings.
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
const MUTED = '#4a433d';
const CRIMSON = '#a8323b'; // the site's crimson, darkened for print
const RULE = '#d9d3cc';

const s = StyleSheet.create({
  page: { paddingTop: 34, paddingBottom: 40, paddingHorizontal: 44, fontFamily: 'Inter', fontSize: 9.3, color: INK, lineHeight: 1.38 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  photo: { width: 74, height: 74, borderRadius: 37, marginLeft: 16 },
  name: { fontSize: 22, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.1 },
  headline: { fontSize: 10.5, fontWeight: 600, color: MUTED, marginTop: 4 },
  contact: { fontSize: 9, color: MUTED, marginTop: 6 },
  link: { color: MUTED, textDecoration: 'none' },
  headerRule: { marginTop: 10, borderBottomWidth: 1.5, borderBottomColor: CRIMSON, width: 36 },
  section: { marginTop: 11 },
  heading: {
    fontSize: 9.5,
    fontWeight: 800,
    color: CRIMSON,
    textTransform: 'uppercase',
    paddingBottom: 3,
    marginBottom: 6,
    borderBottomWidth: 0.6,
    borderBottomColor: RULE,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  roleTitle: { fontSize: 11, fontWeight: 600 },
  dates: { fontSize: 9.5, fontWeight: 600 },
  org: { color: MUTED, marginTop: 1 },
  group: { fontSize: 9.3, fontWeight: 600, marginTop: 5, marginBottom: 1 },
  bullet: { flexDirection: 'row', marginTop: 2 },
  dot: { width: 10 },
  bulletText: { flex: 1 },
  item: { marginBottom: 6 },
  itemTitle: { fontWeight: 600, fontSize: 10 },
  tech: { color: MUTED, fontSize: 9, marginTop: 1.5 },
  skillRow: { flexDirection: 'row', marginBottom: 2.5 },
  skillLabel: { width: 128, fontWeight: 600 },
  skillValue: { flex: 1 },
  footer: { position: 'absolute', bottom: 16, left: 44, right: 44 },
  footerText: { fontSize: 7.5, color: '#8a827a', textAlign: 'center' },
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

/** "https://www.linkedin.com/in/x" → "linkedin.com/in/x": readable, and still a full address to a parser. */
const bare = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export function ResumeDocument() {
  // Two pages: the newest key projects, then two Lab research projects.
  const projects = keyProjects.slice(0, 4);
  // Research only: the shipped Lab tools (MongoDB tuning, k6 suites) are already in Experience.
  const selectedRnd = rdProjects.filter((p) => p.status !== 'SHIPPED').slice(0, 2);
  // "Ollama · Qwen3 · Gemma" reads as one token to some parsers; commas split it.
  const skillList = (skills: string[]) => skills.join(', ').replace(/ · /g, ', ');
  const keywords = [...new Set(skillCategories.flatMap((c) => c.skills))].join(', ');
  // Two fixed lines, so an address is never wrapped (or broken at a hyphen).
  const contactLines = [
    [
      { text: profile.location },
      { text: profile.email, href: `mailto:${profile.email}` },
      { text: profile.phone, href: profile.phoneHref },
    ],
    [
      profile.linkedin && { text: bare(profile.linkedin), href: profile.linkedin },
      { text: bare(profile.github), href: profile.github },
      { text: 'dhucar.in', href: 'https://dhucar.in' },
    ].filter(Boolean) as { text: string; href?: string }[],
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
            <Text style={s.headline}>{profile.title} | R&amp;D and Problem Solving | .NET and Self-Hosted AI</Text>
            {contactLines.map((line, n) => (
              <Text key={n} style={[s.contact, n > 0 ? { marginTop: 1 } : {}]}>
                {line.map((c, i) => (
                  <React.Fragment key={c.text}>
                    {i > 0 && '  |  '}
                    {c.href ? <Link style={s.link} src={c.href}>{c.text}</Link> : c.text}
                  </React.Fragment>
                ))}
              </Text>
            ))}
          </View>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={PORTRAIT} style={s.photo} />
        </View>
        <View style={s.headerRule} />

        <View style={s.section}>
          <Heading>Professional Summary</Heading>
          <Text>{profile.summary}</Text>
        </View>

        <View style={s.section}>
          <Heading>Technical Skills</Heading>
          {skillCategories.map((c) => (
            <View key={c.title} style={s.skillRow} wrap={false}>
              <Text style={s.skillLabel}>{c.title}:</Text>
              <Text style={s.skillValue}>{skillList(c.skills)}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Heading>Professional Experience</Heading>
          <View style={s.row}>
            <Text style={s.roleTitle}>{experience.title}</Text>
            <Text style={s.dates}>{experience.duration}</Text>
          </View>
          <Text style={s.org}>
            {experience.company}, {experience.location} ({experience.type})
          </Text>
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
          <Heading>Key Projects</Heading>
          {projects.map((p) => (
            <View key={p.title} style={s.item} wrap={false}>
              <Text style={s.itemTitle}>{p.title}</Text>
              <Text>{p.description}</Text>
              {p.outcome && <Text style={{ marginTop: 1.5 }}><Text style={{ fontWeight: 600 }}>Result: </Text>{p.outcome}</Text>}
              <Text style={s.tech}>Technologies: {p.tech.join(', ')}</Text>
            </View>
          ))}
        </View>

        <View style={s.section}>
          <Heading>Research and Side Projects</Heading>
          {selectedRnd.map((p) => (
            <View key={p.title} style={s.item} wrap={false}>
              <Text style={s.itemTitle}>{p.title}</Text>
              <Text>{p.description}</Text>
              <Text style={s.tech}>Technologies: {p.tech.join(', ')}</Text>
            </View>
          ))}
        </View>

        <View style={s.section} wrap={false}>
          <Heading>Education</Heading>
          <Text style={s.itemTitle}>{education.degree}</Text>
          <Text style={s.org}>{education.institution}, {education.location}</Text>
        </View>

        <View fixed style={s.footer}>
          <Text style={s.footerText}>{profile.name} | Résumé | dhucar.in</Text>
        </View>
      </Page>
    </Document>
  );
}
