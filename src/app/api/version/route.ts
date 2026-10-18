// The build id of the deployment answering, so an open tab can tell when a
// newer version is live (components/pwa-register.tsx). Never cached.
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json(
    { buildId: process.env.NEXT_PUBLIC_BUILD_ID || 'dev' },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
