import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, Alert, TouchableOpacity, Linking } from 'react-native';
import api from '@/lib/api';
import { STRAPI_BASE_URL } from '@/lib/config';
interface Material { id: number; title?: string; name?: string; fileUrl?: string; subject?: { name?: string }; }
export default function StudentMaterialsScreen() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/student/materials'); setMaterials(r.data); } catch { Alert.alert('Error', 'Failed to load.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  const openFile = (url: string) => { const full = url.startsWith('http') ? url : `${STRAPI_BASE_URL}${url}`; Linking.openURL(full).catch(() => Alert.alert('Error', 'Cannot open.')); };
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#f59e0b" /></View>;
  return (
    <FlatList data={materials} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#f59e0b" />}
      ListEmptyComponent={<Text style={s.empty}>No materials available.</Text>}
      renderItem={({ item }) => (
        <View style={s.card}>
          <View style={s.icon}><Text style={s.iconText}>📄</Text></View>
          <View style={s.info}><Text style={s.title}>{item.title || item.name || 'Material'}</Text>{item.subject?.name && <Text style={s.subject}>{item.subject.name}</Text>}</View>
          {item.fileUrl && <TouchableOpacity style={s.openBtn} onPress={() => openFile(item.fileUrl!)}><Text style={s.openText}>Open</Text></TouchableOpacity>}
        </View>
      )}
    />
  );
}
const s = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center' }, iconText: { fontSize: 20 },
  info: { flex: 1 }, title: { fontSize: 14, fontWeight: '800', color: '#1e293b' }, subject: { fontSize: 11, color: '#f59e0b', fontWeight: '700', marginTop: 2 },
  openBtn: { backgroundColor: '#fef9c3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }, openText: { fontSize: 12, fontWeight: '800', color: '#d97706' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
