import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { School } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <School className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              AMFOFANA HIGH SCHOOL
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Home
            </Link>
            <Link
              href="/about"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              About
            </Link>
            <Link
              href="/programs"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Programs
            </Link>
            <Link
              href="/contact"
              className="text-foreground/60 transition-colors hover:text-foreground/80"
            >
              Contact
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center">
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
