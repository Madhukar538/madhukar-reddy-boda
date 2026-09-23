export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="container mx-auto px-4 md:px-6 mt-8">
      <div className="glass glass-pill mx-auto max-w-md px-6 py-3 text-center text-sm text-muted-foreground">
        © {currentYear} Boda Madhukar Reddy · Crafted with care
      </div>
    </footer>
  );
}
