import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
interface Exam { id: number; name: string; date: string; term?: string; startTime?: string; classe?: { name?: string }; }
export default function TeacherExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/teacher/exams'); setExams(r.data); } catch { Alert.alert('Error', 'Failed.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  const now = new Date(); now.setHours(0,0,0,0);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#f59e0b" /></View>;
  return (
    <FlatList data={exams} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#f59e0b" />}
      ListEmptyComponent={<Text style={s.empty}>No exams found.</Text>}
      renderItem={({ item }) => {
        const upcoming = new Date(item.date) >= now;
        return (
          <View style={[s.card, upcoming && s.upcomingCard]}>
            <View style={{ flex: 1 }}>
              {item.term && <Text style={[s.term, upcoming && { color: '#fcd34d' }]}>{item.term}</Text>}
              <Text style={[s.name, upcoming && { color: '#fff' }]}>{item.name}</Text>
              {item.classe?.name && <Text style={[s.class_, upcoming && { color: '#fde68a' }]}>Class: {item.classe.name}</Text>}
            </View>
            <View style={s.dateBlock}>
              <Text style={[s.date, upcoming && { color: '#fff' }]}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              {item.startTime && <Text style={[s.time, upcoming && { color: '#fde68a' }]}>{item.startTime.slice(0,5)}</Text>}
            </View>
          </View>
        );
      }}
    />
  );
}
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  upcomingCard: { backgroundColor: '#d97706' },
  term: { fontSize: 9, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 3 },
  name: { fontSize: 14, fontWeight: '800', color: '#1e293b' }, class_: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 3 },
  dateBlock: { alignItems: 'flex-end' }, date: { fontSize: 12, fontWeight: '900', color: '#1e293b' }, time: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
