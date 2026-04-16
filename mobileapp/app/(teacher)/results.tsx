import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import api from '@/lib/api';
interface Result { id: number; marks: number; grade?: string; student?: { name?: string; username?: string; userId?: string }; exam?: { name?: string; term?: string }; }
const gradeColor = (g: string) => ({ A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }[g] || '#64748b');
export default function TeacherResultsScreen() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const fetch = async (q?: string) => {
    try {
      const url = q ? `/teacher/results/filter?studentId=${q}` : '/teacher/results/filter';
      const r = await api.get(url); setResults(r.data);
    } catch { Alert.alert('Error', 'Failed to load.'); } finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetch(); }, []);
  const filtered = search.length >= 2 ? results.filter(r => (r.student?.name || r.student?.username || '').toLowerCase().includes(search.toLowerCase()) || (r.student?.userId || '').toLowerCase().includes(search.toLowerCase())) : results;
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#10b981" /></View>;
  return (
    <View style={s.container}>
      <View style={s.searchBox}>
        <TextInput style={s.searchInput} placeholder="Search by student name or ID..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
      </View>
      <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#10b981" />}
        ListEmptyComponent={<Text style={s.empty}>No results found.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.avatar}><Text style={s.avatarText}>{((item.student?.username || item.student?.name || 'U').charAt(0)).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.studentName}>{item.student?.username || item.student?.name || 'Unknown'}</Text>
              <Text style={s.examName}>{item.exam?.name || 'Exam'} {item.exam?.term ? `· ${item.exam.term}` : ''}</Text>
            </View>
            <View style={s.right}>
              <Text style={s.score}>{item.marks}%</Text>
              {item.grade && <View style={[s.gradeBadge, { backgroundColor: gradeColor(item.grade) + '22' }]}><Text style={[s.gradeText, { color: gradeColor(item.grade) }]}>{item.grade}</Text></View>}
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
  avatar: { width: 42, height: 42, borderRadius: 13, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 17, fontWeight: '900', color: '#10b981' },
  studentName: { fontSize: 13, fontWeight: '800', color: '#1e293b' }, examName: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 }, score: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }, gradeText: { fontSize: 10, fontWeight: '900' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
