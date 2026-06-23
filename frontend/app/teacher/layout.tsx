import Sidebar from "@/components/layout/Sidebar";
import SessionGuard from "@/components/SessionGuard";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const menuItems = [
    { name: 'Dashboard', href: '/teacher' },
    { name: 'My Classes', href: '/teacher/classes' },
    { name: 'Students', href: '/teacher/students' },
    { name: 'Attendance', href: '/teacher/attendance' },
    { name: 'Timetable', href: '/teacher/timetable' },
    { name: 'Exams', href: '/teacher/exams' },
    { name: 'Results Management', href: '/teacher/results' },
    { name: 'Upload Materials', href: '/teacher/materials' },
    { name: 'Student Transcripts', href: '/teacher/transcripts' },
    { name: 'Messages', href: '/teacher/messages' },
    { name: 'My Salary', href: '/teacher/finance/my-salary' },
    { name: 'Profile', href: '/teacher/profile' },
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
