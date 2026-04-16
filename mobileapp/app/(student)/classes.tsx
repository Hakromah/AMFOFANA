import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
interface ClassItem { id: number; name: string; grade?: string; teacher?: { name?: string }; }
export default function StudentClassesScreen() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/student/classes'); setClasses(r.data); } catch { Alert.alert('Error', 'Failed to load.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  return (
    <FlatList data={classes} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#3b82f6" />}
      ListEmptyComponent={<Text style={s.empty}>No classes enrolled.</Text>}
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.icon}><Text style={s.iconText}>🏫</Text></View>
          <View style={s.info}>
            <Text style={s.name}>{item.name}</Text>
            {item.grade && <Text style={s.meta}>Grade {item.grade}</Text>}
            {item.teacher?.name && <Text style={s.teacher}>👨‍🏫 {item.teacher.name}</Text>}
          </View>
        </View>
      )}
    />
  );
}
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' }, iconText: { fontSize: 20 },
  info: { flex: 1 }, name: { fontSize: 14, fontWeight: '800', color: '#1e293b' }, meta: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 }, teacher: { fontSize: 11, color: '#3b82f6', fontWeight: '600', marginTop: 3 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
