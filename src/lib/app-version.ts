/**
 * Whether a newer deployment than this page's is live. Set by
 * components/pwa-register.tsx; read by components/view-transitions.tsx, which
 * then leaves in-site link clicks alone so they become full page loads.
 */
let isOutdated = false;

export const markOutdated = () => {
  isOutdated = true;
};

export const appIsOutdated = () => isOutdated;
