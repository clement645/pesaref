import Link from 'next/link';

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container flex flex-col gap-4 py-10 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>&copy; {new Date().getFullYear()} PesaRef. All rights reserved.</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/how-it-works" className="hover:text-foreground">How It Works</Link>
          <Link href="/terms" className="hover:text-foreground">Terms &amp; Conditions</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/contact" className="hover:text-foreground">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
