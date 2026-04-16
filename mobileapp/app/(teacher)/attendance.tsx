import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
interface AttendanceRecord { id: number; date: string; status: string; student?: { name?: string; username?: string }; subject?: { name?: string }; }
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PRESENT: { bg: '#f0fdf4', text: '#10b981' }, ABSENT: { bg: '#fef2f2', text: '#ef4444' }, LATE: { bg: '#fffbeb', text: '#f59e0b' },
};
export default function TeacherAttendanceScreen() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/teacher/attendance'); setRecords(r.data); } catch { Alert.alert('Error', 'Failed.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#10b981" /></View>;
  return (
    <FlatList data={records} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#10b981" />}
      ListEmptyComponent={<Text style={s.empty}>No attendance records.</Text>}
      renderItem={({ item }) => {
        const status = STATUS_COLORS[item.status] || STATUS_COLORS.PRESENT;
        return (
          <View style={s.card}>
            <View style={s.avatar}><Text style={s.avatarText}>{((item.student?.name || item.student?.username || 'S').charAt(0)).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.student}>{item.student?.name || item.student?.username || 'Student'}</Text>
              {item.subject?.name && <Text style={s.subject}>{item.subject.name}</Text>}
              <Text style={s.date}>{new Date(item.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
            </View>
            <View style={[s.statusTag, { backgroundColor: status.bg }]}><Text style={[s.statusText, { color: status.text }]}>{item.status}</Text></View>
          </View>
        );
      }}
    />
  );
}
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 14, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '900', color: '#10b981' },
  student: { fontSize: 13, fontWeight: '800', color: '#1e293b' }, subject: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 }, date: { fontSize: 10, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  statusTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }, statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
