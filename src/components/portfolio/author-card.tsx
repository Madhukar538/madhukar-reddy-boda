export function AuthorCard() {
  return (
    <div className="glass-inset p-5">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]">
          MR
        </div>
        <div className="space-y-1">
          <p className="text-[15px] font-semibold text-foreground">Boda Madhukar Reddy</p>
          <p className="text-sm font-medium text-primary">Software Architect @ Revalsys Technologies</p>
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
