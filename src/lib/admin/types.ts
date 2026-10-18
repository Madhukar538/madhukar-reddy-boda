/** Shapes returned by the portfolio API (camelCase JSON). */

export type AuthToken = {
  accessToken: string;
  expiresAt: string;
  email: string;
  authMethods: string[];
  recoveryCodesLeft: number;
};

export type MfaChallenge = { mfaToken: string; expiresAt: string };

export type SetupResult = { enrollmentToken: string; totpSecret: string; otpAuthUri: string };

export type RecoveryCodes = { recoveryCodes: string[] };

export type PasskeyOptions = { challengeId: string; options: Record<string, unknown> };

export type AdminInfo = {
  email: string;
  lastLoginAt: string | null;
  passkeyCount: number;
  recoveryCodesLeft: number;
  /** The database switch settings/security.IsPasswordLoginEnabled. */
  isPasswordLoginEnabled: boolean;
  /** Whether password sign-in works now (the switch is ignored while no passkey exists). */
  isPasswordLoginAllowed: boolean;
};

export type SignInOptions = {
  isPasswordLoginEnabled: boolean;
  /** True only while first-time setup can still run (a setup token is set and no admin exists yet). */
  isSetupAvailable: boolean;
};

export type Passkey = { id: string; name: string; createdAt: string; lastUsedAt: string | null; isBackedUp: boolean };

export type SaveResult = { id: string; isRevalidated: boolean };

export type Post = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  category: string;
  tags: string[];
  isPublished: boolean;
  updatedAt?: string;
  updatedBy?: string;
};

export type ProjectKind = 'key' | 'client' | 'lab';

export const KIND_LABELS: Record<ProjectKind, string> = { key: 'Key projects', client: 'Client work', lab: 'R&D Lab' };

export const LAB_STATUSES = ['SHIPPED', 'WIP', 'POC', 'RESEARCH'] as const;

export type Project = {
  id: string;
  kind: ProjectKind;
  title: string;
  description: string;
  tech: string[];
  post: string;
  isFeatured: boolean;
  outcome: string;
  status: string;
  client: string;
  role: string;
  duration: string;
  url: string;
  responsibilities: string[];
  sortOrder: number;
  isPublished: boolean;
  updatedAt?: string;
};

export type Profile = {
  name: string;
  title: string;
  company: string;
  location: string;
  email: string;
  phone: string;
  phoneHref: string;
  github: string;
  linkedin: string;
  twitter: string;
  summary: string;
  /** What he is focused on now, shown on the site's profile card. */
  now: string;
  /** When the note last changed; set by the API. */
  nowUpdatedAt: string | null;
  skillCategories: { title: string; color: string; skills: string[] }[];
  experience: {
    title: string;
    company: string;
    duration: string;
    location: string;
    type: string;
    highlights: { label: string; value: string }[];
    groups: { label: string; items: string[] }[];
  };
  education: { degree: string; institution: string; location: string; description: string };
  updatedAt?: string;
};

export type CountItem = { key: string; count: number };

export type TrafficSummary = {
  days: number;
  pageViews: number;
  visitors: number;
  daily: { day: string; pageViews: number; visitors: number }[];
  topPages: CountItem[];
  topReferrers: CountItem[];
  devices: CountItem[];
  countries: CountItem[];
};

export type AuditEntry = {
  id: string;
  at: string;
  action: string;
  isSuccess: boolean;
  email: string;
  ipAddress: string;
  userAgent: string;
  detail: string;
};

/** One difference between the deployed built-in content and the database (GetContentSync). */
export type ContentSyncItem = {
  type: 'post' | 'project' | 'profile';
  id: string;
  title: string;
  change: 'new' | 'changed';
  fields: string[];
};

export type ContentSyncResult = { applied: number; isRevalidated: boolean };

/** One page of an admin list (GetAllPosts, GetAllProjects, GetAuditLog, GetComments). */
export type Paged<T> = { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number };

/** A post as listed in the admin, without its body. */
export type PostListItem = Pick<Post, 'id' | 'title' | 'category' | 'tags' | 'date' | 'isPublished' | 'updatedAt'>;

/** A post as offered in the project editor's picker. */
export type PostOption = { id: string; title: string };

export type CommentStatus = 'pending' | 'approved' | 'spam';

export type AdminComment = {
  id: string;
  slug: string;
  postTitle: string;
  name: string;
  body: string;
  status: CommentStatus;
  country: string;
  createdAt: string;
};
