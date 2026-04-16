import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import api from '@/lib/api';
interface Student { userId?: string; id: number; name?: string; username?: string; email?: string; }
export default function TeacherStudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const fetch = async () => {
    try {
      const r = await api.get('/teacher/classes');
      const allStudents: Student[] = [];
      const seen = new Set<number>();
      r.data.forEach((cls: any) => { (cls.students || []).forEach((st: Student) => { if (!seen.has(st.id)) { seen.add(st.id); allStudents.push(st); } }); });
      setStudents(allStudents);
    } catch { Alert.alert('Error', 'Failed.'); } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetch(); }, []);
  const filtered = students.filter(st => (st.name || st.username || '').toLowerCase().includes(search.toLowerCase()) || (st.userId || '').toLowerCase().includes(search.toLowerCase()));
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#8b5cf6" /></View>;
  return (
    <View style={s.container}>
      <View style={s.searchBox}><TextInput style={s.searchInput} placeholder="Search students..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} /></View>
      <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#8b5cf6" />}
        ListEmptyComponent={<Text style={s.empty}>No students found.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.avatar}><Text style={s.avatarText}>{((item.name || item.username || 'S').charAt(0)).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{item.name || item.username || 'Student'}</Text>
              {item.email && <Text style={s.email}>{item.email}</Text>}
              {item.userId && <Text style={s.id}>ID: {item.userId}</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBox: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchInput: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f5f3ff', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#8b5cf6' },
  name: { fontSize: 14, fontWeight: '800', color: '#1e293b' }, email: { fontSize: 11, color: '#64748b', fontWeight: '500', marginTop: 2 }, id: { fontSize: 10, color: '#94a3b8', fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
