import { School } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-6">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-0">
          <School className="h-6 w-6" />
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © {new Date().getFullYear()} AMFOFANA HIGH SCHOOL. All rights reserved.
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm font-medium">
          <Link
            href="/about"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
          >
            Contact
          </Link>
          <Link
            href="/privacy"
            className="text-foreground/60 transition-colors hover:text-foreground/80"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
