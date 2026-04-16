import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
interface AttendanceRecord { id: number; date: string; status: string; subject?: { name?: string }; }
const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  PRESENT: { bg: '#f0fdf4', text: '#10b981', label: 'Present' },
  ABSENT: { bg: '#fef2f2', text: '#ef4444', label: 'Absent' },
  LATE: { bg: '#fffbeb', text: '#f59e0b', label: 'Late' },
};
export default function StudentAttendanceScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/student/attendance'); setRecords(r.data); } catch { Alert.alert('Error', 'Failed to load.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  const total = records.length;
  const present = records.filter(r => r.status === 'PRESENT').length;
  const pct = total > 0 ? Math.round((present / total) * 100) : 0;
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#10b981" /></View>;
  return (
    <FlatList data={records} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
      ListHeaderComponent={
        <View style={s.summaryCard}>
          <Text style={s.summaryTitle}>Attendance Rate</Text>
          <Text style={s.summaryPct}>{pct}%</Text>
          <Text style={s.summarySub}>{present} present out of {total} classes</Text>
          <View style={s.progressTrack}><View style={[s.progressFill, { width: `${pct}%` }]} /></View>
        </View>
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#10b981" />}
      ListEmptyComponent={<Text style={s.empty}>No attendance records.</Text>}
      renderItem={({ item }) => {
        const status = STATUS_COLORS[item.status] || STATUS_COLORS.PRESENT;
        return (
          <View style={s.card}>
            <View style={[s.statusTag, { backgroundColor: status.bg }]}><Text style={[s.statusText, { color: status.text }]}>{status.label}</Text></View>
            <View style={s.info}>{item.subject?.name && <Text style={s.subject}>{item.subject.name}</Text>}<Text style={s.date}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text></View>
          </View>
        );
      }}
    />
  );
}
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: 16, gap: 10 },
  summaryCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 24, marginBottom: 8 },
  summaryTitle: { color: '#64748b', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2 },
  summaryPct: { color: '#f8fafc', fontSize: 48, fontWeight: '900', letterSpacing: -2, marginVertical: 4 },
  summarySub: { color: '#475569', fontSize: 13, fontWeight: '600' },
  progressTrack: { height: 6, backgroundColor: '#1e293b', borderRadius: 3, marginTop: 16, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statusTag: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 }, statusText: { fontSize: 11, fontWeight: '800' },
  info: { flex: 1 }, subject: { fontSize: 13, fontWeight: '800', color: '#1e293b' }, date: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
