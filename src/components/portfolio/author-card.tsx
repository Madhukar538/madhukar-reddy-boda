import Image from 'next/image';

export function AuthorCard() {
  return (
    <div className="glass-inset p-5">
      <div className="flex items-start gap-4">
        <Image src="/icons/icon-192.png" alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-full ring-1 ring-foreground/15" />
        <div className="space-y-1">
          <p className="text-[15px] font-semibold text-foreground">Boda Madhukar Reddy</p>
          <p className="text-sm font-medium text-primary">Senior Software Engineer @ Revalsys Technologies</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Building high-throughput .NET Core systems, load-testing with k6 + Grafana,
            and engineering AI-driven automation tools. Writing about real-world
            engineering problems and production-first solutions.
          </p>
        </div>
      </div>
    </div>
  );
}
