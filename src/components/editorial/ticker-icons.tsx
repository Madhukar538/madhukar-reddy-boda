import { Sparkles } from 'lucide-react';
import {
  siAngular, siApachesolr, siClaude, siCloudflare, siDocker, siDotnet, siGithubcopilot, siGrafana, siK6, siModelcontextprotocol,
  siMongodb, siMqtt, siNextdotjs, siOllama, siPostgresql, siReact, siRedis, siTypescript, siWebrtc,
  siPython, siNodedotjs, siKubernetes, siGo, siRust, siVuedotjs, siTailwindcss, siFigma, siSwift, siKotlin, siFlutter,
  type SimpleIcon,
} from 'simple-icons';

/**
 * Logos the story's running band can show, by simple-icons slug. A fixed list (rather than all of
 * simple-icons) keeps the page small; any other slug, and "ai", shows a sparkle.
 */
export const TICKER_ICONS: Record<string, SimpleIcon> = Object.fromEntries(
  [
    siAngular, siApachesolr, siClaude, siCloudflare, siDocker, siDotnet, siGithubcopilot, siGrafana, siK6, siModelcontextprotocol,
    siMongodb, siMqtt, siNextdotjs, siOllama, siPostgresql, siReact, siRedis, siTypescript, siWebrtc,
    siPython, siNodedotjs, siKubernetes, siGo, siRust, siVuedotjs, siTailwindcss, siFigma, siSwift, siKotlin, siFlutter,
  ].map((icon) => [icon.slug, icon])
);

export function TickerMark({ icon }: { icon: string }) {
  const logo = TICKER_ICONS[icon];
  if (!logo) return <Sparkles className="ed-ticker-logo" />;
  return (
    <svg className="ed-ticker-logo" viewBox="0 0 24 24" fill="currentColor">
      <path d={logo.path} />
    </svg>
  );
}
