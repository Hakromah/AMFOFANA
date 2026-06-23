import Sidebar from '@/components/layout/Sidebar';
import SessionGuard from '@/components/SessionGuard';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: 'Dashboard', href: '/student' },
    { name: 'My Classes', href: '/student/classes' },
    { name: 'Timetable', href: '/student/timetable' },
    { name: 'Attendance', href: '/student/attendance' },
    { name: 'Exams', href: '/student/exams' },
    { name: 'Exam Results', href: '/student/results' },
    { name: 'Materials', href: '/student/materials' },
    { name: 'Transcripts', href: '/student/transcripts' },
    { name: 'Finance', href: '/student/finance' },
    { name: 'Transport', href: '/student/transport' },
    { name: 'Calendar', href: '/student/calendar' },
    { name: 'Notifications', href: '/student/notifications' },
    { name: 'Profile', href: '/student/profile' },
  ];

  return (
    <SessionGuard>
      <div className="flex max-md:flex-col">
        <Sidebar menuItems={menuItems} />
        <main className="flex-1">{children}</main>
      </div>
    </SessionGuard>
  );
}
