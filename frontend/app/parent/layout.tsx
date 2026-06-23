import Sidebar from '@/components/layout/Sidebar';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  const menuItems = [
    { name: 'Parent Dashboard', href: '/parent' },
    { name: 'My Children', href: '/parent/children' },
    { name: 'Finance Overview', href: '/parent/finance' },
    { name: 'Messages', href: '/parent/messages' },
    { name: 'Notifications', href: '/parent/notifications' },
    { name: 'School Calendar', href: '/parent/calendar' },
    { name: 'Documents', href: '/parent/documents' },
    { name: 'Profile', href: '/parent/profile' },
  ];

  return (
    <div className="flex max-md:flex-col">
      <Sidebar menuItems={menuItems} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
