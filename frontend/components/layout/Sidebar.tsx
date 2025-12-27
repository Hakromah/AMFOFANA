'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, School } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import ClientOnly from './ClientOnly';

interface MenuItem {
  name: string;
  href: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
}

export default function Sidebar({ menuItems }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    toast.loading('Logging out...');
    try {
      await api.post('/auth/logout', {});
      toast.success('Logout Successful');
      window.location.href = '/login';
    } catch (error) {
      toast.error('Logout failed. Please try again.');
      console.log(error)
    }
  };

  const navLinks = (
    <nav className="flex flex-col space-y-2">
      {menuItems.map((item) => (
        <Link key={item.name} href={item.href} passHref>
          <Button
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className="w-full justify-start"
          >
            {item.name}
          </Button>
        </Link>
      ))}
    </nav>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 border-r">
        <div className="flex items-center justify-center h-16 border-b">
          <School className="h-8 w-8 mr-2" />
          <span className="font-bold">AMFOFANA</span>
        </div>
        <div className="flex-1 p-4">{navLinks}</div>
        <div className="p-4 border-t">
          <Button onClick={handleLogout} variant="outline" className="w-full">
            Logout
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar - wrapped in ClientOnly to prevent hydration mismatch */}
      <ClientOnly>
        <div className="md:hidden p-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex items-center justify-center h-16 border-b">
                <School className="h-8 w-8 mr-2" />
                <span className="font-bold">AMFOFANA</span>
              </div>
              <div className="flex-1 p-4">{navLinks}</div>
              <div className="p-4 border-t">
                <Button onClick={handleLogout} variant="outline" className="w-full">
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </ClientOnly>
    </>
  );
}
