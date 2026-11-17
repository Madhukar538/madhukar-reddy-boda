/**
 * The story's text helpers, without the schema (lib/story.ts imports zod): safe to use in client
 * components such as the looks' pages (components/looks), which load in the browser on demand.
 */

/** A link target the story may use: a page on the site, or an https address. */
export const isSafeHref = (value: string) => /^\/(?!\/)/.test(value) || /^https:\/\//.test(value);

/** Fills {name}-style placeholders from values, leaving unknown ones as written. */
export const fill = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
