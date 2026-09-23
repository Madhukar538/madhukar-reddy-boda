// Shared by the form (client) and the API schema, kept free of zod so the
// page bundle stays small.
export const CATEGORIES = ['Bug', 'Performance', 'Architecture review', 'Integration / API', 'Other'] as const;
export const URGENCIES = ['Whenever', 'This week', 'Urgent (production)'] as const;
