import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
interface Result { id: number; marks: number; grade?: string; exam?: { name?: string; term?: string }; }
const gradeColor = (g: string) => ({ A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }[g] || '#64748b');
export default function StudentResultsScreen() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/student/results'); setResults(r.data); } catch { Alert.alert('Error', 'Failed to load.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#8b5cf6" /></View>;
  return (
    <FlatList data={results} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#8b5cf6" />}
      ListEmptyComponent={<Text style={s.empty}>No results available.</Text>}
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.info}><Text style={s.examName}>{item.exam?.name || 'Exam'}</Text>{item.exam?.term && <Text style={s.term}>{item.exam.term}</Text>}</View>
          <View style={s.right}>
            <Text style={s.score}>{item.marks}%</Text>
            {item.grade && <View style={[s.gradeBadge, { backgroundColor: gradeColor(item.grade) + '22' }]}><Text style={[s.gradeText, { color: gradeColor(item.grade) }]}>{item.grade}</Text></View>}
          </View>
        </View>
      )}
    />
  );
}
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  info: { flex: 1 }, examName: { fontSize: 14, fontWeight: '800', color: '#1e293b' }, term: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 3 },
  right: { alignItems: 'flex-end', gap: 4 }, score: { fontSize: 20, fontWeight: '900', color: '#1e293b' },
  gradeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }, gradeText: { fontSize: 11, fontWeight: '900' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
