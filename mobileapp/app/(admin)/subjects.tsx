import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, TextInput, RefreshControl, Alert, Modal } from 'react-native';
import api from '@/lib/api';

interface Subject { id: number; name: string; code?: string; }

export default function SubjectsScreen() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });
  const [creating, setCreating] = useState(false);

  const fetch = async () => {
    try { const r = await api.get('/admin/subjects'); setSubjects(r.data); }
    catch { Alert.alert('Error', 'Failed to load subjects.'); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!form.name) { Alert.alert('Required', 'Subject name is required.'); return; }
    setCreating(true);
    try { await api.post('/admin/subjects', form); Alert.alert('Success', 'Subject created.'); setIsOpen(false); setForm({ name: '', code: '' }); fetch(); }
    catch { Alert.alert('Error', 'Failed to create.'); }
    finally { setCreating(false); }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await api.delete(`/admin/subjects/${id}`); fetch(); } catch { Alert.alert('Error', 'Failed.'); } } },
    ]);
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

  const filtered = subjects.filter(sub => (sub.name || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <View style={s.container}>
      <View style={s.controls}>
        <TextInput style={s.searchInput} placeholder="Search subjects..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
        <TouchableOpacity style={[s.createBtn, { backgroundColor: '#7c3aed' }]} onPress={() => setIsOpen(true)}>
          <Text style={s.createBtnText}>+ New Subject</Text>
        </TouchableOpacity>
      </View>
      <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#8b5cf6" />}
        ListEmptyComponent={<Text style={s.empty}>No subjects found.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={[s.icon, { backgroundColor: '#f5f3ff' }]}><Text style={s.iconText}>📚</Text></View>
            <View style={s.info}><Text style={s.name}>{item.name}</Text>{item.code && <Text style={s.code}>{item.code}</Text>}</View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={s.deleteBtn}><Text style={s.deleteText}>✕</Text></TouchableOpacity>
          </View>
        )}
      />
      <Modal visible={isOpen} animationType="slide" transparent>
        <View style={s.overlay}>
          <View style={s.modal}>
            <Text style={s.modalTitle}>New Subject</Text>
            {[{ label: 'Subject Name', key: 'name', placeholder: 'e.g. Mathematics' }, { label: 'Code (optional)', key: 'code', placeholder: 'e.g. MATH101' }].map(({ label, key, placeholder }) => (
              <View key={key} style={{ marginBottom: 14 }}>
                <Text style={s.label}>{label}</Text>
                <TextInput style={s.input} placeholder={placeholder} placeholderTextColor="#94a3b8" value={form[key as keyof typeof form]} onChangeText={v => setForm(f => ({ ...f, [key]: v }))} />
              </View>
            ))}
            <View style={s.actions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setIsOpen(false)}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={[s.confirmBtn, { backgroundColor: '#7c3aed' }]} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={s.confirmText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { padding: 16, backgroundColor: '#fff', gap: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchInput: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  createBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' }, createBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  icon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' }, iconText: { fontSize: 20 },
  info: { flex: 1 }, name: { fontSize: 15, fontWeight: '800', color: '#1e293b' }, code: { fontSize: 11, color: '#8b5cf6', fontWeight: '700', marginTop: 2 },
  deleteBtn: { padding: 8 }, deleteText: { color: '#ef4444', fontSize: 16, fontWeight: '900' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }, cancelText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  confirmBtn: { flex: 1, borderRadius: 14, paddingVertical: 14, alignItems: 'center' }, confirmText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
