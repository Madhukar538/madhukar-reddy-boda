/** Recognition for the site and its work, newest first. Shown in the footer and on About. */
export type Award = {
  /** Who gave it. */
  body: string;
  /** What was received, e.g. "Nominee". */
  title: string;
  /** What it was for. */
  project: string;
  /** When, as shown (e.g. "October 2026"). */
  month: string;
  /** The certificate. */
  url: string;
};

export const awards: Award[] = [
  {
    body: 'WD Awards',
    title: 'Site Favorite',
    project: 'dhucar.in',
    month: 'November 2026',
    url: 'https://static.wdawards.com/certificates/2026/11/fb421fdc612770dd.pdf',
  },
  {
    body: 'WD Awards',
    title: 'Nominee',
    project: 'dhucar.in',
    month: 'October 2026',
    url: 'https://static.wdawards.com/certificates/2026/10/e05c89b81030aaed.pdf',
  },
];
