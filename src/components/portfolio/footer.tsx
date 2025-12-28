export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="container mx-auto py-4 text-center text-sm text-muted-foreground">
        <p>{currentYear} Boda Madhukar Reddy.</p>
      </div>
    </footer>
  );
}
