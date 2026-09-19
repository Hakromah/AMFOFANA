/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  BookOpen, Tag, Layers, BarChart3, Plus, Trash2,
  Save, CheckCircle, AlertCircle, ChevronDown, ChevronRight
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:1337';

function getToken() {
  if (typeof window !== 'undefined') return localStorage.getItem('jwt') || '';
  return '';
}

async function apiFetch(path: string, opts: any = {}) {
  const res = await fetch(`${API}/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}`, ...opts.headers },
  });
  if (!res.ok) throw new Error((await res.json())?.error?.message || res.statusText);
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AcademicYear { id: number; name: string; }
interface Period { id: number; name: string; periodType: string; order: number; startDate?: string; endDate?: string; academicYear?: { id: number; name: string }; }
interface Category { id: number; name: string; code: string; description?: string; isActive: boolean; }
interface Blueprint { id: number; name: string; isDefault: boolean; totalWeightTarget: number; categoryWeights: any[]; academicYear?: any; semester?: any; classe?: any; }
interface GradingScheme { id: number; name: string; isDefault: boolean; passingScore: number; grades: any[]; }
interface SchoolClass { id: number; name: string; }

// ─── Tab Button ────────────────────────────────────────────────────────────────
function TabBtn({ active, onClick, icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-blue-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-white text-sm ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
      {msg}
    </div>
  );
}

// ─── Periods Tab ──────────────────────────────────────────────────────────────
function PeriodsTab() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', periodType: 'SEMESTER', order: '1', startDate: '', endDate: '' });
  const [toast, setToast] = useState<any>(null);

  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    apiFetch('/admin/academic-years?pagination[limit]=100').then((d: any) => {
      const list = Array.isArray(d) ? d : d?.data?.map((x: any) => ({ id: x.id, ...x.attributes })) || [];
      setYears(list);
    }).catch(() => {});
  }, []);

  const loadPeriods = useCallback(async (yearId: string) => {
    if (!yearId) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/admin/academic-periods?academicYearId=${yearId}`);
      setPeriods(Array.isArray(data) ? data : []);
    } catch { setPeriods([]); }
    setLoading(false);
  }, []);

  useEffect(() => { loadPeriods(selectedYear); }, [selectedYear, loadPeriods]);

  const save = async () => {
    if (!form.name || !selectedYear) return showToast('Name and academic year are required', 'error');
    try {
      await apiFetch('/admin/academic-periods', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, periodType: form.periodType, order: Number(form.order), startDate: form.startDate || null, endDate: form.endDate || null, academicYear: Number(selectedYear) }),
      });
      showToast('Academic period created', 'success');
      setForm({ name: '', periodType: 'SEMESTER', order: '1', startDate: '', endDate: '' });
      loadPeriods(selectedYear);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this academic period?')) return;
    try { await apiFetch(`/admin/academic-periods/${id}`, { method: 'DELETE' }); showToast('Deleted successfully', 'success'); loadPeriods(selectedYear); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <div className="flex items-center gap-4">
        <Label>Academic Year</Label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Select Year..." /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Create Academic Period</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Semester 1 / Term 1" /></div>
          <div className="space-y-1"><Label>Type</Label>
            <Select value={form.periodType} onValueChange={v => setForm(f => ({ ...f, periodType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="SEMESTER">Semester</SelectItem><SelectItem value="TERM">Term</SelectItem><SelectItem value="QUARTER">Quarter</SelectItem><SelectItem value="MODULE">Module</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-1"><Label>Order</Label><Input type="number" min="1" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} /></div>
          <div className="space-y-1"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
          <div className="space-y-1"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
          <div className="flex items-end"><Button onClick={save} className="w-full"><Plus className="w-4 h-4 mr-1" /> Create</Button></div>
        </CardContent>
      </Card>

      {loading ? <div className="text-center text-gray-500 py-4">Loading...</div> : (
        <div className="grid gap-3">
          {periods.map(p => (
            <Card key={p.id} className="border-l-4 border-l-blue-500">
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-gray-500 flex gap-2 mt-0.5">
                    <Badge variant="outline">{p.periodType}</Badge>
                    <span>Order: {p.order}</span>
                    {p.startDate && <span>{p.startDate} → {p.endDate}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => del(p.id)}><Trash2 className="w-4 h-4" /></Button>
              </CardContent>
            </Card>
          ))}
          {periods.length === 0 && selectedYear && <div className="text-center text-gray-400 py-8">No academic periods found for this year</div>}
        </div>
      )}
    </div>
  );
}

// ─── Categories Tab ───────────────────────────────────────────────────────────
function CategoriesTab() {
  const [items, setItems] = useState<Category[]>([]);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [toast, setToast] = useState<any>(null);
  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const load = useCallback(async () => {
    try { const d = await apiFetch('/admin/assessment-categories'); setItems(Array.isArray(d) ? d : []); } catch { setItems([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!form.name || !form.code) return showToast('Name and code are required', 'error');
    try {
      await apiFetch('/admin/assessment-categories', { method: 'POST', body: JSON.stringify({ name: form.name, code: form.code.toUpperCase(), description: form.description, isActive: true }) });
      showToast('Assessment Category created', 'success');
      setForm({ name: '', code: '', description: '' });
      load();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    try { await apiFetch(`/admin/assessment-categories/${id}`, { method: 'DELETE' }); showToast('Deleted successfully', 'success'); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <Card>
        <CardHeader><CardTitle className="text-base">Create Assessment Category</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1"><Label>Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Quiz / Midterm Exam" /></div>
          <div className="space-y-1"><Label>Code</Label><Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. QUIZ / FINAL" /></div>
          <div className="space-y-1"><Label>Description</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional notes" /></div>
          <Button onClick={save} className="col-span-full md:col-span-1"><Plus className="w-4 h-4 mr-1" /> Create Category</Button>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {items.map(c => (
          <Card key={c.id} className="border-l-4 border-l-purple-500">
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-gray-500 flex gap-2"><Badge variant="secondary">{c.code}</Badge>{c.description && <span>{c.description}</span>}</div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => del(c.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <div className="text-center text-gray-400 py-8">No categories configured</div>}
      </div>
    </div>
  );
}

// ─── Blueprint Builder Tab ────────────────────────────────────────────────────
function BlueprintsTab() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [periods, setPeriods] = useState<Period[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [schemes, setSchemes] = useState<GradingScheme[]>([]);
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [toast, setToast] = useState<any>(null);
  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const [form, setForm] = useState({
    name: '', academicYear: '', semester: '', classe: '', gradingScheme: '', isDefault: false,
    weights: [] as { categoryId: string; categoryCode: string; categoryName: string; weight: string; maxScore: string }[],
  });

  const loadAll = useCallback(async () => {
    try {
      const [yr, cat, sch, cls] = await Promise.all([
        apiFetch('/admin/academic-years?pagination[limit]=100').catch(() => []),
        apiFetch('/admin/assessment-categories').catch(() => []),
        apiFetch('/admin/grading-schemes').catch(() => []),
        apiFetch('/admin/classes').catch(() => []),
      ]);
      const toList = (d: any) => Array.isArray(d) ? d : d?.data?.map((x: any) => ({ id: x.id, ...x.attributes })) || [];
      setYears(toList(yr)); setCategories(toList(cat)); setSchemes(toList(sch)); setClasses(toList(cls));
    } catch { }
  }, []);

  const loadBlueprints = useCallback(async (yearId: string) => {
    if (!yearId) return;
    try { const d = await apiFetch(`/admin/assessment-blueprints?academicYearId=${yearId}`); setBlueprints(Array.isArray(d) ? d : []); }
    catch { setBlueprints([]); }
  }, []);

  const loadPeriods = useCallback(async (yearId: string) => {
    if (!yearId) return;
    try { const d = await apiFetch(`/admin/academic-periods?academicYearId=${yearId}`); setPeriods(Array.isArray(d) ? d : []); }
    catch { setPeriods([]); }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { loadBlueprints(selectedYear); loadPeriods(selectedYear); }, [selectedYear, loadBlueprints, loadPeriods]);

  const addWeight = () => {
    setForm(f => ({ ...f, weights: [...f.weights, { categoryId: '', categoryCode: '', categoryName: '', weight: '', maxScore: '100' }] }));
  };

  const updateWeight = (idx: number, field: string, value: string) => {
    setForm(f => {
      const w = [...f.weights];
      if (field === 'categoryId') {
        const cat = categories.find(c => String(c.id) === value);
        w[idx] = { ...w[idx], categoryId: value, categoryCode: cat?.code || '', categoryName: cat?.name || '' };
      } else {
        w[idx] = { ...w[idx], [field]: value };
      }
      return { ...f, weights: w };
    });
  };

  const removeWeight = (idx: number) => setForm(f => ({ ...f, weights: f.weights.filter((_, i) => i !== idx) }));

  const totalWeight = form.weights.reduce((s, w) => s + (Number(w.weight) || 0), 0);

  const save = async () => {
    if (!form.name || !form.academicYear) return showToast('Name and academic year are required', 'error');
    if (form.weights.length > 0 && Math.abs(totalWeight - 100) > 0.01) return showToast(`Total weight must equal 100% (currently ${totalWeight}%)`, 'error');
    try {
      const categoryWeights = form.weights.map(w => ({ categoryId: Number(w.categoryId), categoryCode: w.categoryCode, categoryName: w.categoryName, weight: Number(w.weight), maxScore: Number(w.maxScore) }));
      await apiFetch('/admin/assessment-blueprints', {
        method: 'POST',
        body: JSON.stringify({ name: form.name, isDefault: form.isDefault, totalWeightTarget: 100, categoryWeights, academicYear: Number(form.academicYear), semester: form.semester ? Number(form.semester) : null, classe: form.classe ? Number(form.classe) : null, gradingScheme: form.gradingScheme ? Number(form.gradingScheme) : null }),
      });
      showToast('Assessment Blueprint saved', 'success');
      setForm({ name: '', academicYear: '', semester: '', classe: '', gradingScheme: '', isDefault: false, weights: [] });
      loadBlueprints(selectedYear);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this blueprint?')) return;
    try { await apiFetch(`/admin/assessment-blueprints/${id}`, { method: 'DELETE' }); showToast('Deleted successfully', 'success'); loadBlueprints(selectedYear); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <div className="flex items-center gap-4">
        <Label>Academic Year</Label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-56"><SelectValue placeholder="Select Year..." /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Create Assessment Blueprint</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="space-y-1 col-span-2 md:col-span-1"><Label>Blueprint Name</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Standard High School Blueprint" /></div>
            <div className="space-y-1"><Label>Academic Year</Label>
              <Select value={form.academicYear} onValueChange={v => { setForm(f => ({ ...f, academicYear: v })); loadPeriods(v); }}>
                <SelectTrigger><SelectValue placeholder="Year..." /></SelectTrigger>
                <SelectContent>{years.map(y => <SelectItem key={y.id} value={String(y.id)}>{y.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Period (Optional)</Label>
              <Select value={form.semester} onValueChange={v => setForm(f => ({ ...f, semester: v }))}>
                <SelectTrigger><SelectValue placeholder="All Periods..." /></SelectTrigger>
                <SelectContent><SelectItem value="">All Periods</SelectItem>{periods.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Class (Optional)</Label>
              <Select value={form.classe} onValueChange={v => setForm(f => ({ ...f, classe: v }))}>
                <SelectTrigger><SelectValue placeholder="All Classes..." /></SelectTrigger>
                <SelectContent><SelectItem value="">All Classes</SelectItem>{classes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label>Grading Scheme</Label>
              <Select value={form.gradingScheme} onValueChange={v => setForm(f => ({ ...f, gradingScheme: v }))}>
                <SelectTrigger><SelectValue placeholder="Default Scheme..." /></SelectTrigger>
                <SelectContent><SelectItem value="">Default Scheme</SelectItem>{schemes.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Weight builder */}
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Category Weights</Label>
              <div className={`text-sm font-medium px-2 py-1 rounded ${Math.abs(totalWeight - 100) < 0.01 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                Total: {totalWeight.toFixed(0)}%
              </div>
            </div>
            {form.weights.map((w, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-center">
                <Select value={w.categoryId} onValueChange={v => updateWeight(i, 'categoryId', v)}>
                  <SelectTrigger className="col-span-2"><SelectValue placeholder="Category..." /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex items-center gap-1"><Input type="number" min="0" max="100" value={w.weight} onChange={e => updateWeight(i, 'weight', e.target.value)} placeholder="Weight %" /><span className="text-xs">%</span></div>
                <div className="flex items-center gap-1"><Input type="number" min="1" value={w.maxScore} onChange={e => updateWeight(i, 'maxScore', e.target.value)} placeholder="Max" /><span className="text-xs">pts</span></div>
                <Button variant="ghost" size="sm" className="text-red-400" onClick={() => removeWeight(i)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addWeight}><Plus className="w-4 h-4 mr-1" /> Add Category</Button>
          </div>

          <Button onClick={save} className="w-full md:w-auto"><Save className="w-4 h-4 mr-1" /> Save Blueprint</Button>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {blueprints.map(bp => (
          <Card key={bp.id} className="border-l-4 border-l-green-500">
            <CardContent className="flex items-center justify-between py-3">
              <div>
                <div className="flex items-center gap-2"><span className="font-medium">{bp.name}</span>{bp.isDefault && <Badge className="bg-green-100 text-green-700 text-xs">Default</Badge>}</div>
                <div className="text-sm text-gray-500 flex flex-wrap gap-2 mt-0.5">
                  {bp.semester && <Badge variant="outline">{bp.semester.name}</Badge>}
                  {bp.classe && <Badge variant="outline">{bp.classe.name}</Badge>}
                  {(bp.categoryWeights || []).map((cw: any, i: number) => (
                    <span key={i} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded">{cw.categoryName}: {cw.weight}%</span>
                  ))}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => del(bp.id)}><Trash2 className="w-4 h-4" /></Button>
            </CardContent>
          </Card>
        ))}
        {blueprints.length === 0 && selectedYear && <div className="text-center text-gray-400 py-8">No blueprints created for this year</div>}
      </div>
    </div>
  );
}

// ─── Grading Schemes Tab ──────────────────────────────────────────────────────
function GradingSchemesTab() {
  const [schemes, setSchemes] = useState<GradingScheme[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('50');
  const [toast, setToast] = useState<any>(null);
  const showToast = (msg: string, type: 'success' | 'error') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const DEFAULT_GRADES = [
    { min: 90, max: 100, letter: 'A',  point: 4.0, remark: 'Excellent' },
    { min: 85, max: 89,  letter: 'A-', point: 3.7, remark: 'Very Good' },
    { min: 80, max: 84,  letter: 'B+', point: 3.3, remark: 'Good' },
    { min: 75, max: 79,  letter: 'B',  point: 3.0, remark: 'Above Average' },
    { min: 70, max: 74,  letter: 'B-', point: 2.7, remark: 'Satisfactory' },
    { min: 65, max: 69,  letter: 'C+', point: 2.3, remark: 'Pass' },
    { min: 60, max: 64,  letter: 'C',  point: 2.0, remark: 'Pass' },
    { min: 50, max: 59,  letter: 'D',  point: 1.0, remark: 'Below Average' },
    { min: 0,  max: 49,  letter: 'F',  point: 0.0, remark: 'Fail' },
  ];

  const load = useCallback(async () => {
    try { const d = await apiFetch('/admin/grading-schemes'); setSchemes(Array.isArray(d) ? d : []); } catch { setSchemes([]); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!newName) return showToast('Name is required', 'error');
    try {
      await apiFetch('/admin/grading-schemes', { method: 'POST', body: JSON.stringify({ name: newName, passingScore: Number(newPass), isDefault: false, grades: DEFAULT_GRADES }) });
      showToast('Grading scheme created', 'success'); setNewName(''); setNewPass('50'); load();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const del = async (id: number) => {
    if (!confirm('Delete this grading scheme?')) return;
    try { await apiFetch(`/admin/grading-schemes/${id}`, { method: 'DELETE' }); showToast('Deleted successfully', 'success'); load(); }
    catch (e: any) { showToast(e.message, 'error'); }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast {...toast} />}
      <Card>
        <CardHeader><CardTitle className="text-base">Create Grading Scheme</CardTitle></CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div className="space-y-1 flex-1"><Label>Scheme Name</Label><Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="e.g. Standard 4.0 GPA Scale" /></div>
          <div className="space-y-1 w-32"><Label>Passing Score %</Label><Input type="number" min="0" max="100" value={newPass} onChange={e => setNewPass(e.target.value)} /></div>
          <Button onClick={create}><Plus className="w-4 h-4 mr-1" /> Create Scheme</Button>
        </CardContent>
      </Card>
      <div className="grid gap-3">
        {schemes.map(s => (
          <Card key={s.id} className="border-l-4 border-l-orange-500">
            <CardContent className="py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                  {expanded === s.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="font-medium">{s.name}</span>
                  {s.isDefault && <Badge className="bg-orange-100 text-orange-700 text-xs">Default</Badge>}
                  <span className="text-sm text-gray-500">Pass Mark: {s.passingScore}%</span>
                </div>
                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => del(s.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
              {expanded === s.id && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50"><th className="px-3 py-1 text-left">Min %</th><th className="px-3 py-1 text-left">Max %</th><th className="px-3 py-1 text-left">Grade</th><th className="px-3 py-1 text-left">Points (GPA)</th><th className="px-3 py-1 text-left">Remark</th></tr></thead>
                    <tbody>{(s.grades || DEFAULT_GRADES).map((g: any, i: number) => (
                      <tr key={i} className="border-t"><td className="px-3 py-1">{g.min}%</td><td className="px-3 py-1">{g.max}%</td><td className="px-3 py-1 font-bold">{g.letter}</td><td className="px-3 py-1">{g.point}</td><td className="px-3 py-1 text-gray-600">{g.remark}</td></tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {schemes.length === 0 && <div className="text-center text-gray-400 py-8">No custom schemes (system default scheme is active)</div>}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AcademicConfigPage() {
  const [tab, setTab] = useState<'periods' | 'categories' | 'blueprints' | 'schemes'>('periods');

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Academic & Assessment Configuration</h1>
        <p className="text-gray-500 text-sm mt-1">Manage Academic Periods, Assessment Categories, Weight Blueprints, and Grading Schemes</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b pb-3">
        <TabBtn active={tab === 'periods'} onClick={() => setTab('periods')} icon={<BookOpen className="w-4 h-4" />} label="Academic Periods" />
        <TabBtn active={tab === 'categories'} onClick={() => setTab('categories')} icon={<Tag className="w-4 h-4" />} label="Assessment Categories" />
        <TabBtn active={tab === 'blueprints'} onClick={() => setTab('blueprints')} icon={<Layers className="w-4 h-4" />} label="Assessment Blueprints" />
        <TabBtn active={tab === 'schemes'} onClick={() => setTab('schemes')} icon={<BarChart3 className="w-4 h-4" />} label="Grading Schemes" />
      </div>

      {tab === 'periods' && <PeriodsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'blueprints' && <BlueprintsTab />}
      {tab === 'schemes' && <GradingSchemesTab />}
    </div>
  );
}
