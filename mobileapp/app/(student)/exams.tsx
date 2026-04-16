import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
interface Exam { id: number; name: string; date: string; term?: string; startTime?: string; }
export default function StudentExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/student/exams'); setExams(r.data); } catch { Alert.alert('Error', 'Failed to load.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  const now = new Date(); now.setHours(0, 0, 0, 0);
  const upcoming = exams.filter(e => new Date(e.date) >= now);
  const past = exams.filter(e => new Date(e.date) < now);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#ef4444" /></View>;
  return (
    <FlatList
      data={[...upcoming, ...past]} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#ef4444" />}
      ListEmptyComponent={<Text style={s.empty}>No exams found.</Text>}
      ListHeaderComponent={upcoming.length > 0 ? <Text style={s.sectionHeader}>UPCOMING</Text> : null}
      renderItem={({ item, index }) => {
        const isUpcoming = new Date(item.date) >= now;
        const divider = index === upcoming.length && past.length > 0;
        return <>
          {divider && <Text style={[s.sectionHeader, { marginTop: 16 }]}>PAST EXAMS</Text>}
          <View style={[s.card, isUpcoming && s.upcomingCard]}>
            <View><Text style={[s.examName, isUpcoming && { color: '#fff' }]}>{item.name}</Text>
              {item.term && <Text style={[s.examTerm, isUpcoming && { color: '#93c5fd' }]}>{item.term}</Text>}</View>
            <View style={[s.dateBadge, isUpcoming && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={[s.dateText, isUpcoming && { color: '#fff' }]}>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              {item.startTime && <Text style={[s.timeText, isUpcoming && { color: '#93c5fd' }]}>{item.startTime.slice(0, 5)}</Text>}
            </View>
          </View>
        </>;
      }}
    />
  );
}
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: 16, gap: 10 },
  sectionHeader: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  card: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  upcomingCard: { backgroundColor: '#2563eb' },
  examName: { fontSize: 14, fontWeight: '800', color: '#1e293b' }, examTerm: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginTop: 3 },
  dateBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  dateText: { fontSize: 13, fontWeight: '900', color: '#ef4444' }, timeText: { fontSize: 10, color: '#f87171', fontWeight: '700', marginTop: 2 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
