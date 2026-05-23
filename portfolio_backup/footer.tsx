export function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="border-t">
      <div className="container py-4 text-center text-sm text-muted-foreground">
        <p>&copy; {currentYear} Boda Madhukar Reddy. All Rights Reserved.</p>
      </div>
    </footer>
  );
}
