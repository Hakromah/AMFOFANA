import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import api from '@/lib/api';
interface ClassItem { id: number; name: string; grade?: string; students?: any[]; }
export default function TeacherClassesScreen() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/teacher/classes'); setClasses(r.data); } catch { Alert.alert('Error', 'Failed to load classes.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#10b981" /></View>;
  return (
    <FlatList data={classes} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#10b981" />}
      ListEmptyComponent={<Text style={s.empty}>No classes assigned.</Text>}
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.header}>
            <View style={s.icon}><Text style={s.iconText}>🏫</Text></View>
            <View style={s.badge}><Text style={s.badgeText}>COHORT #{item.id}</Text></View>
          </View>
          <Text style={s.name}>{item.name}</Text>
          {item.grade && <Text style={s.grade}>Grade {item.grade}</Text>}
          <View style={s.footer}>
            <Text style={s.studentCount}>👩‍🎓 {item.students?.length || 0} students</Text>
            <View style={s.activeBadge}><Text style={s.activeText}>● Active</Text></View>
          </View>
        </View>
      )}
    />
  );
}
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  icon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' }, iconText: { fontSize: 24 },
  badge: { backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 9, fontWeight: '800', color: '#64748b', letterSpacing: 1.5 },
  name: { fontSize: 20, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5 },
  grade: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 4 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  studentCount: { fontSize: 13, fontWeight: '700', color: '#64748b' },
  activeBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activeText: { fontSize: 11, fontWeight: '800', color: '#10b981' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
