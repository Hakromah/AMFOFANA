/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
   Menu, School, LogOut, LayoutDashboard, GraduationCap, Calendar,
   Users, Settings, ChevronRight, UserCircle, Activity, Bell,
   AlertCircle, MessageSquare, FileUp, UserCheck, BookOpen,
   Clock, UserPlus, BookOpenText, BarChart4, UsersRound, Landmark
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import ClientOnly from './ClientOnly';
import { motion, AnimatePresence } from 'framer-motion';
import Cookies from 'js-cookie';

interface MenuItem {
   name: string;
   href: string;
}

interface SidebarProps {
   menuItems: MenuItem[];
}

// --- ICON MAPPING LOGIC ---
const getIcon = (name: string) => {
   const n = name.toLowerCase();
   if (n.includes('dashboard')) return <LayoutDashboard className="w-4 h-4" />;
   if (n.includes('result') || n.includes('grade')) return <GraduationCap className="w-4 h-4" />;
   if (n.includes('exam') || n.includes('schedule')) return <Calendar className="w-4 h-4" />;
   if (n.includes('timetable')) return <Clock className="w-4 h-4" />;
   if (n.includes('users management')) return <UsersRound className="w-4 h-4" />;
   if (n.includes('subject management')) return <BookOpen className="w-4 h-4" />;
   if (n.includes('teacher assignment')) return <UserPlus className="w-4 h-4" />;
   if (n.includes('class management')) return <Landmark className="w-4 h-4" />;
   if (n.includes('student assignment')) return <BookOpenText className="w-4 h-4" />;
   if (n.includes('report')) return <BarChart4 className="w-4 h-4" />;
   if (n.includes('message')) return <MessageSquare className="w-4 h-4" />;
   if (n.includes('material') || n.includes('upload')) return <FileUp className="w-4 h-4" />;
   if (n.includes('attendance')) return <UserCheck className="w-4 h-4" />;
   if (n.includes('student') || n.includes('class')) return <Users className="w-4 h-4" />;
   return <Settings className="w-4 h-4" />;
};

export default function Sidebar({ menuItems }: SidebarProps) {
   const pathname = usePathname();
   const [userData, setUserData] = useState<{ name: string; role: string } | null>(null);
   const [draftCount, setDraftCount] = useState(0);
   const [isOnline, setIsOnline] = useState(false);

   useEffect(() => {
      const fetchSidebarData = async () => {
         try {
            const userRes = await api.get('/auth/me');
            // Standardize the role string (remove ROLE_ prefix if present)
            const cleanRole = userRes.data.role.replace('ROLE_', '');

            setUserData({
               name: userRes.data.name,
               role: cleanRole
            });
            setIsOnline(true);

            // Conditional fetch for teachers
            if (cleanRole === 'TEACHER') {
               const resultsRes = await api.get('/teacher/results/filter').catch(() => ({ data: [] }));
               const drafts = resultsRes.data.filter((r: any) => r.status === 'DRAFT').length;
               setDraftCount(drafts);
            }
         } catch (e) {
            console.error("Auth sync error:", e);
            setIsOnline(false);
         }
      };
      fetchSidebarData();
   }, []);

   const handleLogout = async () => {
      const tid = toast.loading('Terminating session...');
      try {
         await api.post('/auth/logout', {});

         // Manually clear the First-Party NextJS cookies since the Strapi network headers can't touch them natively
         Cookies.remove('accessToken', { path: '/' });
         Cookies.remove('userRole', { path: '/' });

         toast.success('Signed out safely', { id: tid });
         window.location.href = '/login';
      } catch (error) {
         toast.error('Sign out failed', { id: tid });
         console.log(error)
      }
   };

   const renderContent = () => (
      <div className="flex flex-col h-full bg-white">
         {/* Branding Section */}
         <div className="flex items-center justify-between px-7 h-24 border-b border-slate-50">
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-200">
                  <School className="h-6 w-6 text-white" />
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter text-slate-900 leading-none italic">AMF</span>
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Registry.</span>
               </div>
            </div>
            <div className="relative p-2 bg-slate-50 rounded-xl">
               <Bell className="w-5 h-5 text-slate-400" />
               {draftCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
            </div>
         </div>

         {/* Navigation Section */}
         <div className="flex-1 px-4 py-8 space-y-8 overflow-y-auto">

            <div className="flex-1 px-4 py-6 overflow-y-auto">
               <div className="space-y-6">
                  {/* Section Header */}
                  <div className="px-3">
                     <p className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                        {userData?.role || 'Guest'} Menu
                     </p>
                  </div>

                  {/* Navigation */}
                  <nav className="flex flex-col gap-1">
                     {menuItems.map((item) => {
                        const isActive = pathname === item.href;

                        return (
                           <Link key={item.name} href={item.href} className="group">
                              <div
                                 className={`relative flex items-center gap-3 h-11 px-4 rounded-xl transition-all
                                    ${isActive
                                       ? 'bg-slate-900 text-white'
                                       : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                              >
                                 {/* Active Indicator */}
                                 {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-full bg-primary" />
                                 )}

                                 <span
                                    className={`transition-colors ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-700'
                                       }`}
                                 >
                                    {getIcon(item.name)}
                                 </span>
                                 <span className="text-sm font-medium">
                                    {item.name}
                                 </span>
                              </div>
                           </Link>
                        );
                     })}
                  </nav>
               </div>
            </div>


            {/* <div>
               <p className="px-5 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-5">
                  {userData?.role || 'Guest'} Navigation
               </p>
               <nav className="flex flex-col space-y-1.5">
                  {menuItems.map((item) => {
                     const isActive = pathname === item.href;
                     return (
                        <Link key={item.name} href={item.href} className="block">
                           <Button
                              variant="ghost"
                              className={`w-full justify-between h-12 px-5 rounded-[1.2rem] transition-all duration-300 ${isActive
                                 ? 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:bg-slate-800 hover:text-white'
                                 : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                                 }`}
                           >
                              <div className="flex items-center gap-4">
                                 <span className={isActive ? "text-blue-400" : "text-slate-400"}>
                                    {getIcon(item.name)}
                                 </span>
                                 <span className="font-bold text-xs uppercase tracking-tight italic">
                                    {item.name}
                                 </span>
                              </div>
                              {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                           </Button>
                        </Link>
                     );
                  })}
               </nav>
            </div> */}

            {/* Teacher Specific Alerts */}
            <AnimatePresence>
               {userData?.role === 'TEACHER' && draftCount > 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="px-2">
                     <div className="bg-amber-50 border border-amber-100/50 rounded-3xl p-5 flex gap-4">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                        <div className="space-y-1">
                           <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Pending Uploads</p>
                           <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                              You have <span className="font-black underline">{draftCount} grades</span> awaiting final publication.
                           </p>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         {/* User Card Footer */}
         <div className="p-5 mt-auto border-t border-slate-50 bg-slate-50/30">
            <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
               <div className="flex items-center gap-4 mb-6 relative z-10">
                  <div className="relative">
                     <div className="bg-slate-800 p-2 rounded-2xl border border-slate-700">
                        <UserCircle className="w-8 h-8 text-slate-500" />
                     </div>
                     <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-4 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                     </span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                     <span className="font-black text-sm text-white truncate italic tracking-tighter uppercase">
                        {userData?.name || 'Syncing...'}
                     </span>
                     <div className="flex items-center gap-1.5 mt-0.5">
                        <Activity className="w-3 h-3 text-blue-400" />
                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-widest">
                           {userData?.role ? `${userData.role} Session` : 'Authenticating'}
                        </span>
                     </div>
                  </div>
               </div>
               <Button
                  onClick={handleLogout}
                  className="w-full justify-center gap-2 bg-white/5 md:hover:bg-primary md:hover:text-white text-slate-400 border duration-500 border-white/10 rounded-2xl transition-all h-11 text-[10px] font-black uppercase tracking-[0.2em]"
               >
                  <LogOut className="w-3.5 h-3.5" /> Close Session
               </Button>
            </div>
         </div>
      </div>
   );

   return (
      <>
         {/* Desktop Sidebar */}
         <aside className="hidden md:flex md:flex-col md:w-80 border-r border-slate-100 h-screen sticky top-0 z-50">
            {renderContent()}
         </aside>

         {/* Mobile Sidebar */}
         <ClientOnly>
            <div className="md:hidden p-4 bg-white border-b flex items-center justify-between sticky top-0 z-50">
               <div className="flex items-center gap-3">
                  <div className="bg-blue-600 p-2 rounded-xl">
                     <School className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-black text-lg tracking-tighter uppercase italic">AMF</span>
               </div>
               <Sheet>
                  <SheetTrigger asChild>
                     <Button variant="ghost" size="icon" className="relative rounded-2xl bg-slate-50 border border-slate-100">
                        <Menu className="h-6 w-6 text-slate-600" />
                        {draftCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border border-white" />}
                     </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0 border-r-0 rounded-r-[3rem] overflow-hidden">
                     <SheetTitle className="sr-only">Menu</SheetTitle>
                     {renderContent()}
                  </SheetContent>
               </Sheet>
            </div>
         </ClientOnly>
      </>
   );
}


// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { Button } from '@/components/ui/button';
// import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
// import {
//    Menu, School, LogOut, LayoutDashboard, GraduationCap,
//    Calendar, Users, Settings, ChevronRight, UserCircle,
//    Activity, Bell, AlertCircle, MessageSquare, FileUp,
//    UserCheck, BookOpen, Clock, UserPlus, BookOpenText,
//    BarChart4, UsersRound, Landmark
// } from 'lucide-react';
// import api from '@/lib/api';
// import { toast } from 'sonner';
// import ClientOnly from './ClientOnly';
// import { motion, AnimatePresence } from 'framer-motion';

// interface MenuItem {
//    name: string;
//    href: string;
// }

// interface SidebarProps {
//    menuItems: MenuItem[];
// }

// const getIcon = (name: string) => {
//    const n = name.toLowerCase();
//    if (n.includes('dashboard')) return <LayoutDashboard className="w-4 h-4" />;
//    if (n.includes('result') || n.includes('grade')) return <GraduationCap className="w-4 h-4" />;
//    if (n.includes('exam') || n.includes('schedule')) return <Calendar className="w-4 h-4" />;
//    if (n.includes('class') || n.includes('student') && !n.includes('assignment')) return <Users className="w-4 h-4" />;
//    if (n.includes('timetable')) return <Clock className="w-4 h-4" />;
//    if (n.includes('users management')) return <UsersRound className="w-4 h-4" />;
//    if (n.includes('subject management')) return <BookOpen className="w-4 h-4" />;
//    if (n.includes('teacher assignment')) return <UserPlus className="w-4 h-4" />;
//    if (n.includes('class management')) return <Landmark className="w-4 h-4" />;
//    if (n.includes('student assignment')) return <BookOpenText className="w-4 h-4" />;
//    if (n.includes('report')) return <BarChart4 className="w-4 h-4" />;
//    if (n.includes('message')) return <MessageSquare className="w-4 h-4" />;
//    if (n.includes('material') || n.includes('upload')) return <FileUp className="w-4 h-4" />;
//    if (n.includes('attendance')) return <UserCheck className="w-4 h-4" />;
//    return <Settings className="w-4 h-4" />;
// };

// export default function Sidebar({ menuItems }: SidebarProps) {
//    const pathname = usePathname();
//    const [userName, setUserName] = useState('');
//    const [userRole, setUserRole] = useState('');
//    const [isOnline, setIsOnline] = useState(false);
//    const [draftCount, setDraftCount] = useState(0);

//    useEffect(() => {
//       const fetchSidebarData = async () => {
//          try {
//             const [userRes, resultsRes] = await Promise.all([
//                api.get('/auth/me'),
//                api.get('/teacher/results/filter').catch(() => ({ data: [] }))
//             ]);

//             // Using .name directly as per your backend
//             setUserName(userRes.data.name || 'User');
//             setUserRole(userRes.data.role || '');
//             setIsOnline(true);

//             if (resultsRes.data) {
//                const drafts = resultsRes.data.filter((r: any) => r.status === 'DRAFT').length;
//                setDraftCount(drafts);
//             }
//          } catch (e) {
//             setIsOnline(false);
//             console.error("Sidebar Data Fetch Error:", e);
//          }
//       };
//       fetchSidebarData();
//    }, []);

//    const handleLogout = async () => {
//       const tid = toast.loading('Ending session...');
//       try {
//          await api.post('/auth/logout', {});
//          toast.success('Disconnected', { id: tid });
//          window.location.href = '/login';
//       } catch (error) {
//          toast.error('Logout failed', { id: tid });
//       }
//    };

//    // RENDER FUNCTION: Ensures state is fresh inside the JSX
//    const renderSidebarContent = () => (
//       <div className="flex flex-col h-full bg-white">
//          {/* Top Branding */}
//          <div className="flex items-center justify-between px-6 h-24 border-b border-slate-50">
//             <div className="flex items-center gap-3">
//                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-100">
//                   <School className="h-6 w-6 text-white" />
//                </div>
//                <div className="flex flex-col">
//                   <span className="font-black text-xl tracking-tighter text-slate-900 leading-none">AMF</span>
//                   <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Registry</span>
//                </div>
//             </div>
//             <div className="relative p-2 hover:bg-slate-100 rounded-xl transition-colors">
//                <Bell className="w-5 h-5 text-slate-400" />
//                {draftCount > 0 && (
//                   <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
//                      <span className="animate-ping absolute h-full w-full rounded-full bg-rose-400 opacity-75"></span>
//                      <span className="relative rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
//                   </span>
//                )}
//             </div>
//          </div>

//          {/* Navigation Links */}
//          <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
//             <div>
//                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
//                   {userRole ? `${userRole} Portal` : 'Navigation'}
//                </p>
//                <nav className="flex flex-col space-y-1.5">
//                   {menuItems.map((item) => {
//                      const isActive = pathname === item.href;
//                      return (
//                         <Link key={item.name} href={item.href}>
//                            <Button
//                               variant="ghost"
//                               className={`w-full justify-between h-11 px-4 rounded-xl transition-all duration-200 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-100 hover:bg-blue-700 hover:text-white' : 'text-slate-500 hover:bg-slate-100'
//                                  }`}
//                            >
//                               <div className="flex items-center gap-3">
//                                  <span className={isActive ? "text-white" : "text-slate-400"}>
//                                     {getIcon(item.name)}
//                                  </span>
//                                  <span className="font-semibold text-sm">{item.name}</span>
//                               </div>
//                               {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
//                            </Button>
//                         </Link>
//                      );
//                   })}
//                </nav>
//             </div>

//             {/* Contextual Alert - Now inside the render loop */}
//             <AnimatePresence>
//                {userRole === 'TEACHER' && draftCount > 0 && (
//                   <motion.div
//                      initial={{ opacity: 0, y: 10 }}
//                      animate={{ opacity: 1, y: 0 }}
//                      exit={{ opacity: 0, scale: 0.95 }}
//                      className="px-2"
//                   >
//                      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3 items-start shadow-sm shadow-orange-100/50">
//                         <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
//                         <div>
//                            <p className="text-[11px] font-black text-orange-700 uppercase tracking-tight">Pending Sync</p>
//                            <p className="text-[10px] text-orange-600 font-medium leading-tight mt-1">
//                               You have <span className="font-bold underline">{draftCount} draft grades</span> to publish.
//                            </p>
//                         </div>
//                      </div>
//                   </motion.div>
//                )}
//             </AnimatePresence>
//          </div>

//          {/* User Profile Footer */}
//          <div className="p-4 mt-auto">
//             <div className="bg-slate-900 rounded-4xl p-5 shadow-2xl relative overflow-hidden group">
//                <div className="flex items-center gap-3 mb-6 relative z-10">
//                   <div className="relative">
//                      <div className="bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
//                         <UserCircle className="w-8 h-8 text-slate-400" />
//                      </div>
//                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
//                         {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
//                      </span>
//                   </div>
//                   <div className="flex flex-col overflow-hidden">
//                      <span className="font-bold text-sm text-white truncate">{userName || 'Authenticating...'}</span>
//                      <div className="flex items-center gap-1.5">
//                         <Activity className="w-2.5 h-2.5 text-blue-400" />
//                         <span className="text-[9px] text-blue-400 font-black uppercase tracking-tight">Active Session</span>
//                      </div>
//                   </div>
//                </div>
//                <Button
//                   onClick={handleLogout}
//                   className="w-full justify-center gap-2 bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 border border-white/5 rounded-2xl transition-all h-10 text-xs font-bold"
//                >
//                   <LogOut className="w-3.5 h-3.5" />
//                   Sign Out
//                </Button>
//             </div>
//          </div>
//       </div>
//    );

//    return (
//       <>
//          {/* Desktop View */}
//          <aside className="hidden md:flex md:flex-col md:w-72 border-r border-slate-100 h-screen sticky top-0 z-50">
//             {renderSidebarContent()}
//          </aside>

//          {/* Mobile View */}
//          <ClientOnly>
//             <div className="md:hidden p-4 bg-white border-b flex items-center justify-between sticky top-0 z-50">
//                <div className="flex items-center gap-2">
//                   <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg">
//                      <School className="h-5 w-5 text-white" />
//                   </div>
//                   <span className="font-black text-lg tracking-tighter">AMF</span>
//                </div>
//                <Sheet>
//                   <SheetTrigger asChild>
//                      <Button variant="ghost" size="icon" className="relative rounded-xl bg-slate-100">
//                         <Menu className="h-6 w-6 text-slate-600" />
//                         {userRole === 'TEACHER' && draftCount > 0 && (
//                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />
//                         )}
//                      </Button>
//                   </SheetTrigger>
//                   <SheetContent side="left" className="w-72 p-0 border-r-0">
//                      <SheetTitle className="sr-only">Main Navigation</SheetTitle>
//                      {renderSidebarContent()}
//                   </SheetContent>
//                </Sheet>
//             </div>
//          </ClientOnly>
//       </>
//    );
// }

// /* eslint-disable @typescript-eslint/no-explicit-any */
// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';
// import { usePathname } from 'next/navigation';
// import { Button } from '@/components/ui/button';
// import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
// import {
//    Menu,
//    School,
//    LogOut,
//    LayoutDashboard,
//    GraduationCap,
//    Calendar,
//    Users,
//    Settings,
//    ChevronRight,
//    UserCircle,
//    Activity,
//    Bell,
//    AlertCircle,
//    MessageSquare,
//    FileUp,
//    UserCheck,
//    BookOpen,
//    Clock,          // For Timetable
//    UserPlus,       // For Teacher Assignment
//    BookOpenText,   // For Student Assignment
//    BarChart4,      // For Reports
//    UsersRound, // For User Management
//    Landmark
// } from 'lucide-react';
// import api from '@/lib/api';
// import { toast } from 'sonner';
// import ClientOnly from './ClientOnly';
// import { motion, AnimatePresence } from 'framer-motion';

// interface MenuItem {
//    name: string;
//    href: string;
// }

// interface SidebarProps {
//    menuItems: MenuItem[];
// }

// // --- UNIVERSAL ICON LOGIC ---
// const getIcon = (name: string) => {
//    const n = name.toLowerCase();

//    // Core shared items
//    if (n.includes('dashboard')) return <LayoutDashboard className="w-4 h-4" />;
//    if (n.includes('result') || n.includes('grade')) return <GraduationCap className="w-4 h-4" />;
//    if (n.includes('exam') || n.includes('schedule')) return <Calendar className="w-4 h-4" />;
//    if (n.includes('class') || n.includes('student') && !n.includes('assignment')) return <Users className="w-4 h-4" />;

//    // Admin precision mappings
//    if (n.includes('timetable')) return <Clock className="w-4 h-4" />;
//    if (n.includes('users management')) return <UsersRound className="w-4 h-4" />;
//    if (n.includes('subject management')) return <BookOpen className="w-4 h-4" />;
//    if (n.includes('teacher assignment')) return <UserPlus className="w-4 h-4" />;
//    if (n.includes('class management')) return <Landmark className="w-4 h-4" />;
//    if (n.includes('student assignment')) return <BookOpenText className="w-4 h-4" />;
//    if (n.includes('report')) return <BarChart4 className="w-4 h-4" />;

//    // Feature specific items
//    if (n.includes('message')) return <MessageSquare className="w-4 h-4" />;
//    if (n.includes('material') || n.includes('upload')) return <FileUp className="w-4 h-4" />;
//    if (n.includes('attendance')) return <UserCheck className="w-4 h-4" />;

//    return <Settings className="w-4 h-4" />;
// };

// export default function Sidebar({ menuItems }: SidebarProps) {
//    const pathname = usePathname();
//    const [userName, setUserName] = useState('User');
//    const [userRole, setUserRole] = useState('');
//    const [isOnline, setIsOnline] = useState(true);
//    const [draftCount, setDraftCount] = useState(0);

//    useEffect(() => {
//       const fetchSidebarData = async () => {
//          try {
//             const [userRes, resultsRes] = await Promise.all([
//                api.get('/auth/me'),
//                // We attempt to fetch results, but fail silently if not a teacher
//                api.get('/teacher/results/filter').catch(() => ({ data: [] }))
//             ]);

//             setUserName(userRes.data.name);
//             setUserRole(userRes.data.role); // e.g., 'ADMIN', 'TEACHER', 'STUDENT'
//             setIsOnline(true);

//             const drafts = resultsRes.data.filter((r: any) => r.status === 'DRAFT').length;
//             setDraftCount(drafts);
//          } catch (e) {
//             setIsOnline(false);
//             console.log(e)
//          }
//       };
//       fetchSidebarData();
//    }, []);

//    const handleLogout = async () => {
//       const tid = toast.loading('Ending session...');
//       try {
//          await api.post('/auth/logout', {});
//          toast.success('Disconnected', { id: tid });
//          window.location.href = '/login';
//       } catch (error) {
//          toast.error('Logout failed', { id: tid });
//          console.log(error)
//       }
//    };

//    const sidebarContent = (
//       <div className="flex flex-col h-full bg-white">
//          <div className="flex items-center justify-between px-6 h-24 border-b border-slate-50">
//             <div className="flex items-center gap-3">
//                <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-100">
//                   <School className="h-6 w-6 text-white" />
//                </div>
//                <div className="flex flex-col">
//                   <span className="font-black text-xl tracking-tighter text-slate-900 leading-none">AMF</span>
//                   <span className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Registry</span>
//                </div>
//             </div>

//             <div className="relative group cursor-pointer p-2 hover:bg-slate-100 rounded-xl transition-colors">
//                <Bell className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
//                {draftCount > 0 && (
//                   <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
//                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
//                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
//                   </span>
//                )}
//             </div>
//          </div>

//          <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
//             <div>
//                <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
//                   {userRole ? `${userRole} Menu` : 'Main Menu'}
//                </p>
//                <nav className="flex flex-col space-y-1.5">
//                   {menuItems.map((item) => {
//                      const isActive = pathname === item.href;
//                      return (
//                         <Link key={item.name} href={item.href} passHref>
//                            <Button
//                               variant="ghost"
//                               className={`w-full justify-between group transition-all duration-200 h-11 px-4 rounded-xl ${isActive
//                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:text-white'
//                                  : 'text-slate-500 hover:bg-slate-100'
//                                  }`}
//                            >
//                               <div className="flex items-center gap-3">
//                                  <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-primary"}>
//                                     {getIcon(item.name)}
//                                  </span>
//                                  <span className="font-semibold text-sm">{item.name}</span>
//                               </div>
//                               {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
//                            </Button>
//                         </Link>
//                      );
//                   })}
//                </nav>
//             </div>

//             {/* Contextual Alert for Teachers */}
//             <AnimatePresence>
//                {(userRole === 'TEACHER' || userRole === 'admin') && draftCount > 0 && (
//                   <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="px-4">
//                      <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3 items-start">
//                         <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
//                         <div>
//                            <p className="text-[11px] font-black text-orange-700 uppercase tracking-tight">Attention</p>
//                            <p className="text-[10px] text-orange-600 font-medium leading-tight mt-1">
//                               You have <span className="font-bold underline">{draftCount} draft entries</span> to publish.
//                            </p>
//                         </div>
//                      </div>
//                   </motion.div>
//                )}
//             </AnimatePresence>
//          </div>

//          <div className="p-4 mt-auto">
//             <div className="bg-slate-900 rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
//                <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
//                <div className="flex items-center gap-3 mb-6 relative z-10">
//                   <div className="relative">
//                      <div className="bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
//                         <UserCircle className="w-8 h-8 text-slate-400" />
//                      </div>
//                      <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
//                         {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
//                      </span>
//                   </div>
//                   <div className="flex flex-col overflow-hidden">
//                      <span className="font-bold text-sm text-white truncate">{userName}</span>
//                      <div className="flex items-center gap-1.5">
//                         <Activity className="w-2.5 h-2.5 text-blue-400" />
//                         <span className="text-[9px] text-blue-400 font-black uppercase tracking-tight">System Online</span>
//                      </div>
//                   </div>
//                </div>
//                <Button
//                   onClick={handleLogout}
//                   className="w-full justify-center gap-2 bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 border border-white/5 rounded-2xl transition-all h-10 text-xs font-bold"
//                >
//                   <LogOut className="w-3.5 h-3.5" />
//                   Sign Out
//                </Button>
//             </div>
//          </div>
//       </div>
//    );

//    return (
//       <>
//          <aside className="hidden md:flex md:flex-col md:w-72 border-r border-slate-100 h-screen sticky top-0 z-50">
//             {sidebarContent}
//          </aside>

//          <ClientOnly>
//             <div className="md:hidden p-4 bg-white border-b flex items-center justify-between sticky top-0 z-50">
//                <div className="flex items-center gap-2">
//                   <School className="h-6 w-6 text-primary" />
//                   <span className="font-black text-lg tracking-tighter">AMF</span>
//                </div>
//                <Sheet>
//                   <SheetTrigger asChild>
//                      <Button variant="ghost" size="icon" className="rounded-xl bg-slate-100">
//                         <Menu className="h-6 w-6 text-slate-600" />
//                         {userRole === 'TEACHER' && draftCount > 0 && (
//                            <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />
//                         )}
//                      </Button>
//                   </SheetTrigger>
//                   <SheetContent side="left" className="w-72 p-0 border-r-0">
//                      <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
//                      {sidebarContent}
//                   </SheetContent>
//                </Sheet>
//             </div>
//          </ClientOnly>
//       </>
//    );
// }


