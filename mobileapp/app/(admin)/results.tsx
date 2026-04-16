import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';

interface Result { id: number; marks: number; grade?: string; student?: { name?: string; username?: string }; exam?: { name?: string } }

const gradeColor = (g: string) => ({ A: '#10b981', B: '#3b82f6', C: '#f59e0b', D: '#f97316', F: '#ef4444' }[g] || '#64748b');

export default function AdminResultsScreen() {
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try { const r = await api.get('/admin/results'); setResults(r.data); }
    catch { Alert.alert('Error', 'Failed to load results.'); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetch(); }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#10b981" /></View>;

  return (
    <View style={s.container}>
      <FlatList data={results} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#10b981" />}
        ListEmptyComponent={<Text style={s.empty}>No results found.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.avatar}><Text style={s.avatarText}>{((item.student?.username || item.student?.name || 'U').charAt(0)).toUpperCase()}</Text></View>
            <View style={s.info}>
              <Text style={s.name}>{item.student?.username || item.student?.name || 'Unknown'}</Text>
              <Text style={s.exam}>{item.exam?.name || 'Unknown Exam'}</Text>
            </View>
            <View style={s.scoreBlock}>
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
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  avatar: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '900', color: '#10b981' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  exam: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  scoreBlock: { alignItems: 'flex-end', gap: 4 },
  score: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  gradeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  gradeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
