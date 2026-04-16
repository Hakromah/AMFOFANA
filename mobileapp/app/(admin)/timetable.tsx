import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';

interface TimetableEntry {
  id: number; day?: string; startTime?: string; endTime?: string;
  subject?: { name?: string }; classe?: { name?: string }; teacher?: { name?: string };
}

const DAY_COLORS: Record<string, string> = {
  Monday: '#3b82f6', Tuesday: '#10b981', Wednesday: '#f59e0b',
  Thursday: '#8b5cf6', Friday: '#ef4444', Saturday: '#ec4899', Sunday: '#64748b',
};

export default function AdminTimetableScreen() {
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try { const r = await api.get('/admin/timetable'); setEntries(r.data); }
    catch { Alert.alert('Error', 'Failed to load timetable.'); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetch(); }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#8b5cf6" /></View>;

  return (
    <View style={s.container}>
      <FlatList data={entries} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}
        ListEmptyComponent={<Text style={s.empty}>No timetable entries found.</Text>}
        renderItem={({ item }) => {
          const dayColor = DAY_COLORS[item.day || ''] || '#64748b';
          return (
            <View style={s.card}>
              <View style={[s.dayTag, { backgroundColor: dayColor }]}><Text style={s.dayText}>{(item.day || '?').substring(0, 3).toUpperCase()}</Text></View>
              <View style={s.info}>
                <Text style={s.subject}>{item.subject?.name || 'Subject'}</Text>
                <Text style={s.meta}>{item.classe?.name} • {item.teacher?.name || 'Teacher'}</Text>
              </View>
              <View style={s.timeBlock}>
                <Text style={s.time}>{item.startTime}</Text>
                <Text style={s.timeSub}>{item.endTime}</Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  dayTag: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  dayText: { color: '#fff', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  info: { flex: 1 },
  subject: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  meta: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 3 },
  timeBlock: { alignItems: 'flex-end' },
  time: { fontSize: 13, fontWeight: '900', color: '#1e293b' },
  timeSub: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
