/**
 * Renders the résumé PDF from src/data/profile.ts into public/resume.pdf.
 * Runs automatically before `next build` (npm "prebuild"), so every
 * deployment ships a PDF that matches the site. Run manually with
 * `npm run resume`.
 *
 * This runs outside Next.js on purpose: react-pdf needs the project's own
 * React, not the React build that Next vendors for the App Router.
 */
import path from 'node:path';
import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { ResumeDocument } from './resume-document';

const out = path.join(process.cwd(), 'public', 'resume.pdf');

renderToFile(<ResumeDocument />, out)
  .then(() => console.log(`Résumé written to ${path.relative(process.cwd(), out)}`))
  .catch((err) => {
    console.error('Failed to generate résumé PDF:', err);
    process.exit(1);
  });
