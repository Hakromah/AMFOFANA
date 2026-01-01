/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import {
   Menu,
   School,
   LogOut,
   LayoutDashboard,
   GraduationCap,
   Calendar,
   Users,
   Settings,
   ChevronRight,
   UserCircle,
   Activity,
   Bell,
   AlertCircle,
   MessageSquare,
   FileUp,
   UserCheck,
   BookOpen,
   Clock,          // For Timetable
   UserPlus,       // For Teacher Assignment
   BookOpenText,   // For Student Assignment
   BarChart4,      // For Reports
   UsersRound, // For User Management
   Landmark
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import ClientOnly from './ClientOnly';
import { motion, AnimatePresence } from 'framer-motion';

interface MenuItem {
   name: string;
   href: string;
}

interface SidebarProps {
   menuItems: MenuItem[];
}

// --- UNIVERSAL ICON LOGIC ---
const getIcon = (name: string) => {
   const n = name.toLowerCase();

   // Core shared items
   if (n.includes('dashboard')) return <LayoutDashboard className="w-4 h-4" />;
   if (n.includes('result') || n.includes('grade')) return <GraduationCap className="w-4 h-4" />;
   if (n.includes('exam') || n.includes('schedule')) return <Calendar className="w-4 h-4" />;
   if (n.includes('class') || n.includes('student') && !n.includes('assignment')) return <Users className="w-4 h-4" />;

   // Admin precision mappings
   if (n.includes('timetable')) return <Clock className="w-4 h-4" />;
   if (n.includes('users management')) return <UsersRound className="w-4 h-4" />;
   if (n.includes('subject management')) return <BookOpen className="w-4 h-4" />;
   if (n.includes('teacher assignment')) return <UserPlus className="w-4 h-4" />;
   if (n.includes('class management')) return <Landmark className="w-4 h-4" />;
   if (n.includes('student assignment')) return <BookOpenText className="w-4 h-4" />;
   if (n.includes('report')) return <BarChart4 className="w-4 h-4" />;

   // Feature specific items
   if (n.includes('message')) return <MessageSquare className="w-4 h-4" />;
   if (n.includes('material') || n.includes('upload')) return <FileUp className="w-4 h-4" />;
   if (n.includes('attendance')) return <UserCheck className="w-4 h-4" />;

   return <Settings className="w-4 h-4" />;
};

export default function Sidebar({ menuItems }: SidebarProps) {
   const pathname = usePathname();
   const [userName, setUserName] = useState('User');
   const [userRole, setUserRole] = useState('');
   const [isOnline, setIsOnline] = useState(true);
   const [draftCount, setDraftCount] = useState(0);

   useEffect(() => {
      const fetchSidebarData = async () => {
         try {
            const [userRes, resultsRes] = await Promise.all([
               api.get('/auth/me'),
               // We attempt to fetch results, but fail silently if not a teacher
               api.get('/teacher/results/filter').catch(() => ({ data: [] }))
            ]);

            setUserName(userRes.data.name);
            setUserRole(userRes.data.role); // e.g., 'ADMIN', 'TEACHER', 'STUDENT'
            setIsOnline(true);

            const drafts = resultsRes.data.filter((r: any) => r.status === 'DRAFT').length;
            setDraftCount(drafts);
         } catch (e) {
            setIsOnline(false);
         }
      };
      fetchSidebarData();
   }, []);

   const handleLogout = async () => {
      const tid = toast.loading('Ending session...');
      try {
         await api.post('/auth/logout', {});
         toast.success('Disconnected', { id: tid });
         window.location.href = '/login';
      } catch (error) {
         toast.error('Logout failed', { id: tid });
      }
   };

   const sidebarContent = (
      <div className="flex flex-col h-full bg-white">
         <div className="flex items-center justify-between px-6 h-24 border-b border-slate-50">
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-100">
                  <School className="h-6 w-6 text-white" />
               </div>
               <div className="flex flex-col">
                  <span className="font-black text-xl tracking-tighter text-slate-900 leading-none">AMF</span>
                  <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">Registry</span>
               </div>
            </div>

            <div className="relative group cursor-pointer p-2 hover:bg-slate-100 rounded-xl transition-colors">
               <Bell className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
               {draftCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-3 w-3">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500 border-2 border-white"></span>
                  </span>
               )}
            </div>
         </div>

         <div className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
            <div>
               <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">
                  {userRole ? `${userRole} Menu` : 'Main Menu'}
               </p>
               <nav className="flex flex-col space-y-1.5">
                  {menuItems.map((item) => {
                     const isActive = pathname === item.href;
                     return (
                        <Link key={item.name} href={item.href} passHref>
                           <Button
                              variant="ghost"
                              className={`w-full justify-between group transition-all duration-200 h-11 px-4 rounded-xl ${isActive
                                 ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 hover:text-white'
                                 : 'text-slate-500 hover:bg-slate-100'
                                 }`}
                           >
                              <div className="flex items-center gap-3">
                                 <span className={isActive ? "text-white" : "text-slate-400 group-hover:text-blue-600"}>
                                    {getIcon(item.name)}
                                 </span>
                                 <span className="font-semibold text-sm">{item.name}</span>
                              </div>
                              {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                           </Button>
                        </Link>
                     );
                  })}
               </nav>
            </div>

            {/* Contextual Alert for Teachers */}
            <AnimatePresence>
               {userRole === 'TEACHER' && draftCount > 0 && (
                  <motion.div
                     initial={{ opacity: 0, scale: 0.95 }}
                     animate={{ opacity: 1, scale: 1 }}
                     className="px-4"
                  >
                     <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex gap-3 items-start">
                        <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                        <div>
                           <p className="text-[11px] font-black text-orange-700 uppercase tracking-tight">Attention</p>
                           <p className="text-[10px] text-orange-600 font-medium leading-tight mt-1">
                              You have <span className="font-bold underline">{draftCount} draft entries</span> to publish.
                           </p>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>

         <div className="p-4 mt-auto">
            <div className="bg-slate-900 rounded-3xl p-5 shadow-2xl relative overflow-hidden group">
               <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
               <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="relative">
                     <div className="bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
                        <UserCircle className="w-8 h-8 text-slate-400" />
                     </div>
                     <span className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                        {isOnline && <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                     </span>
                  </div>
                  <div className="flex flex-col overflow-hidden">
                     <span className="font-bold text-sm text-white truncate">{userName}</span>
                     <div className="flex items-center gap-1.5">
                        <Activity className="w-2.5 h-2.5 text-blue-400" />
                        <span className="text-[9px] text-blue-400 font-black uppercase tracking-tight">System Online</span>
                     </div>
                  </div>
               </div>
               <Button
                  onClick={handleLogout}
                  className="w-full justify-center gap-2 bg-white/5 hover:bg-rose-600 hover:text-white text-slate-400 border border-white/5 rounded-2xl transition-all h-10 text-xs font-bold"
               >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
               </Button>
            </div>
         </div>
      </div>
   );

   return (
      <>
         <aside className="hidden md:flex md:flex-col md:w-72 border-r border-slate-100 h-screen sticky top-0 z-50">
            {sidebarContent}
         </aside>

         <ClientOnly>
            <div className="md:hidden p-4 bg-white border-b flex items-center justify-between sticky top-0 z-50">
               <div className="flex items-center gap-2">
                  <School className="h-6 w-6 text-blue-600" />
                  <span className="font-black text-lg tracking-tighter">AMF</span>
               </div>
               <Sheet>
                  <SheetTrigger asChild>
                     <Button variant="ghost" size="icon" className="rounded-xl bg-slate-100">
                        <Menu className="h-6 w-6 text-slate-600" />
                        {userRole === 'TEACHER' && draftCount > 0 && (
                           <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white" />
                        )}
                     </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-72 p-0 border-r-0">
                     <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                     {sidebarContent}
                  </SheetContent>
               </Sheet>
            </div>
         </ClientOnly>
      </>
   );
}


