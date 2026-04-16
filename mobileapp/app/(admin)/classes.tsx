import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, TextInput, RefreshControl, Alert, Modal,
} from 'react-native';
import api from '@/lib/api';

interface ClassItem { id: number; name: string; grade: string; }

export default function ClassesScreen() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: '', grade: '' });
  const [creating, setCreating] = useState(false);

  const fetchClasses = async () => {
    try {
      const res = await api.get('/admin/classes');
      setClasses(res.data);
    } catch (e) {
      Alert.alert('Error', 'Failed to load classes.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchClasses(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.grade) { Alert.alert('Validation', 'Name and grade are required.'); return; }
    setCreating(true);
    try {
      await api.post('/admin/classes', form);
      Alert.alert('Success', 'Class created.');
      setIsCreateOpen(false);
      setForm({ name: '', grade: '' });
      fetchClasses();
    } catch (e) { Alert.alert('Error', 'Failed to create class.'); }
    finally { setCreating(false); }
  };

  const handleDelete = (id: number, name: string) => {
    Alert.alert('Delete Class', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.delete(`/admin/classes/${id}`); fetchClasses(); }
        catch { Alert.alert('Error', 'Failed to delete.'); }
      }},
    ]);
  };

  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.grade.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <TextInput style={styles.searchInput} placeholder="Search classes..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsCreateOpen(true)}>
          <Text style={styles.createBtnText}>+ New Class</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchClasses(); }} tintColor="#3b82f6" />}
        ListEmptyComponent={<Text style={styles.empty}>No classes found.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardIcon}><Text style={styles.cardIconText}>🏫</Text></View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardGrade}>Grade {item.grade}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
              <Text style={styles.deleteText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <Modal visible={isCreateOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>New Class</Text>
            {[{ label: 'Class Name', key: 'name', placeholder: 'e.g. 10-A Science' }, { label: 'Grade Level', key: 'grade', placeholder: 'e.g. 10' }].map(({ label, key, placeholder }) => (
              <View key={key} style={{ marginBottom: 14 }}>
                <Text style={styles.formLabel}>{label}</Text>
                <TextInput style={styles.formInput} placeholder={placeholder} placeholderTextColor="#94a3b8" value={form[key as keyof typeof form]} onChangeText={v => setForm(f => ({ ...f, [key]: v }))} />
              </View>
            ))}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateOpen(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreate} disabled={creating}>
                {creating ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Create</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  controls: { padding: 16, backgroundColor: '#fff', gap: 10, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchInput: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  createBtn: { backgroundColor: '#2563eb', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  createBtnText: { color: '#fff', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  cardIconText: { fontSize: 22 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  cardGrade: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 2 },
  deleteBtn: { padding: 8 },
  deleteText: { color: '#ef4444', fontSize: 16, fontWeight: '900' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: '#00000080', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 28, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 20 },
  formLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  formInput: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, fontWeight: '600', color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { color: '#64748b', fontWeight: '800', fontSize: 14 },
  confirmBtn: { flex: 1, backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '900', fontSize: 14 },
});
