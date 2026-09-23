import type { Metadata } from 'next';
import { PageShell } from '@/components/portfolio/page-shell';
import { McpConnect } from '@/components/portfolio/mcp-connect';

export const metadata: Metadata = {
  title: 'Connect your AI — Boda Madhukar Reddy',
  description:
    'This portfolio is an MCP server. Connect Claude, Cursor or VS Code and ask your AI assistant about my experience, projects and writing.',
};

export default function AiPage() {
  return (
    <PageShell
      eyebrow="Model Context Protocol"
      title="Ask your AI about me."
      description="This portfolio is also an MCP server. Connect your AI assistant and it can read my profile, experience, projects and blog directly, then answer questions or assess fit for a role."
    >
      <McpConnect />
    </PageShell>
  );
}
