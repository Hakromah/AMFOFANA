/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import api from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Download,
  Eye,
  FileText,
  FileUp,
  Loader2,
  Monitor,
  Plus,
  Trash2
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog, DialogContent,
  DialogDescription, DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function TeacherMaterialsPage() {
  const [materials, setMaterials] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Form State
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedClasses, setSelectedClasses] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      const [matRes, classRes] = await Promise.all([
        api.get('/teacher/materials'),
        api.get('/teacher/materials/my-classes')
      ]);
      setMaterials(matRes.data);
      setClasses(classRes.data);
    } catch (e: any) {
      // Log the specific error to help with debugging
      console.error("Status: Sync error", e.response?.status);
      console.error("Data: Sync error", e.response?.data);
      toast.error("Failed to sync class resources");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async () => {
    if (!file || !title || selectedClasses.length === 0) {
      return toast.error("Please fill in all required fields");
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('description', description);
    selectedClasses.forEach(id => formData.append('classIds', String(id)));

    setUploading(true);
    try {
      await api.post('/teacher/materials/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success("Resource published successfully");
      setIsUploadOpen(false);
      resetForm();
      fetchData(); // Refresh the list
    } catch (e: any) {
      console.error("Status: Upload failed", e.response?.status);
      console.error("Data: Upload failed", e.response?.data);
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setTitle('');
    setDescription('');
    setSelectedClasses([]);
  };

  const formatBytes = (bytes: number | null | undefined) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (id: number) => {
    const tid = toast.loading("Deleting resource...");
    try {
      await api.delete(`/teacher/materials/${id}`);
      toast.success("Deleted successfully", { id: tid });
      fetchData();
    } catch (e) {
      toast.error("Action failed", { id: tid });
      console.log(e);
    }
  };

  const getFullUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://127.0.0.1:1338';
    return `${baseUrl}${url}`;
  };

  const handleDownload = async (mat: any) => {
    if (!mat.fileUrl) return;
    const tid = toast.loading("Preparing download...");

    try {
      const fullUrl = getFullUrl(mat.fileUrl);
      // 1. Fetch the file data directly
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Network response was not correct');

      const blob = await response.blob();

      // 2. Create a temporary local URL for the file blob
      const url = window.URL.createObjectURL(blob);

      // 3. Create a hidden link and click it
      const link = document.createElement('a');
      link.href = url;

      // Use the clean filename from your database
      const fileName = mat.fileName || 'document.pdf';
      link.setAttribute('download', fileName);

      document.body.appendChild(link);
      link.click();

      // 4. Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Download started", { id: tid });
    } catch (err) {
      console.error("Download error", err);
      // Fallback: just open the URL in a new tab if fetch fails
      window.open(getFullUrl(mat.fileUrl), '_blank');
      toast.dismiss(tid);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" size={40} /></div>;

  return (
    <div className="md:min-h-screen bg-[#F8FAFC] p-[clamp(1.5rem,2vw+0.5rem,3rem)] lg:p-10 space-y-[clamp(1rem,2vw+0.5rem,3rem)]">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-[clamp(1rem,2vw+0.5rem,3rem)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-[0.4em]">
            <Monitor size={14} /> Curriculum Management
          </div>
          <h1 className="text-[clamp(1.2rem,2vw+0.5rem,2.2rem)] font-black text-slate-900 tracking-tighter italic uppercase">
            Learning Resources <span className="text-primary">.</span>
          </h1>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="bg-slate-900 hover:bg-blue-600 text-white rounded-[clamp(1rem,2vw+0.5rem,3rem)] h-14 px-8 font-black shadow-xl">
          <Plus size={20} className="mr-2" /> PUBLISH RESOURCE
        </Button>
      </header>

      {/* Materials Grid */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {materials.map((mat) => (
            <motion.div key={mat.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
              <Card className="rounded-xl border border-slate-100 md:hover:border-primary duration-500 transition-colors shadow-sm bg-white p-4 hover:shadow-md h-full flex flex-col justify-between group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600/10 group-hover:bg-blue-600 transition-colors" />

                <div className="pl-1.5">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex flex-wrap gap-1">
                      {mat.targetClasses.map((c: any) => (
                        <Badge key={c.id} className="bg-blue-50 text-blue-600 border-none font-bold text-[9px] px-1.5 py-0.5 rounded">
                          {c.name}
                        </Badge>
                      ))}
                    </div>
                    <Button onClick={() => handleDelete(mat.id)} variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500 rounded-full h-7 w-7 transition-colors">
                      <Trash2 size={14} />
                    </Button>
                  </div>

                  <div className="flex items-start gap-2 mb-1.5">
                    <FileText className="text-blue-600 shrink-0 mt-0.5" size={15} />
                    <div className="min-w-0">
                      <h3 className="text-xs font-black italic uppercase text-slate-900 leading-tight truncate" title={mat.title}>
                        {mat.title}
                      </h3>
                      <p className="text-slate-400 font-bold text-[10px] mt-0.5 line-clamp-1">{mat.description}</p>
                    </div>
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 mt-2.5 mb-4">
                    <span>Date: {new Date(mat.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{formatBytes(mat.fileSize)}</span>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const isPdf = mat.fileType?.includes('pdf') || mat.fileName?.toLowerCase().endsWith('.pdf');
                        let previewUrl = getFullUrl(mat.fileUrl).replace('/upload/', '/upload/f_auto/');
                        if (isPdf && !previewUrl.toLowerCase().endsWith('.pdf')) {
                          previewUrl += '.pdf';
                        }
                        window.open(previewUrl, "_blank", 'noopener,noreferrer');
                      }}
                      className="flex-1 h-8 rounded-lg border-slate-100 text-slate-700 font-bold text-[9px] uppercase hover:bg-slate-50 transition-all"
                    >
                      <Eye size={12} className="mr-1" /> Preview
                    </Button>
                    <Button
                      onClick={() => handleDownload(mat)}
                      className="flex-1 h-8 rounded-lg bg-rose-600 text-white font-bold text-[9px] uppercase hover:bg-rose-700 transition-all shadow-sm"
                    >
                      <Download size={12} className="mr-1" /> Download
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </main>

      {/* Upload Modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="rounded-[3rem] p-10 sm:max-w-[500px] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-3xl font-black italic tracking-tighter uppercase">Publish a <span className="text-primary">Resource.</span></DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2 italic">Select files to deploy to class.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-6">
            <Input placeholder="Resource title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-900 focus-visible:ring-2 focus-visible:ring-primary/20" />
            <textarea placeholder="Learning details..." value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-2xl bg-slate-50 border-none p-4 font-bold text-sm min-h-[120px] text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400 resize-none" />

            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Deploy to class</p>
              <div className="flex flex-wrap gap-2">
                {classes.map(c => (
                  <Badge
                    key={c.id}
                    onClick={() => setSelectedClasses(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                    className={`cursor-pointer h-10 px-4 rounded-xl font-bold transition-all border-none ${selectedClasses.includes(c.id) ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}
                  >
                    {c.name}
                  </Badge>
                ))}
              </div>
            </div>

            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-100 rounded-[2.5rem] cursor-pointer hover:bg-slate-50 transition-all group">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center max-w-full">
                <FileUp className={`w-10 h-10 mb-2 ${file ? 'text-primary' : 'text-slate-200 group-hover:text-primary'}`} />
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-tighter italic truncate w-full max-w-[250px]">
                  {file ? file.name : 'Select PDF, DOCX, or Image'}
                </p>
              </div>
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <DialogFooter className="mt-8">
            <Button disabled={uploading} onClick={handleUpload} className="w-full h-16 bg-blue-600 hover:bg-slate-900 text-white font-black rounded-3xl transition-all shadow-xl uppercase text-[11px] tracking-[0.2em]">
              {uploading ? <Loader2 className="animate-spin" /> : 'AUTHORIZE PUBLICATION'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
