import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Alert, Linking } from 'react-native';
import api from '@/lib/api';
import { STRAPI_BASE_URL } from '@/lib/config';

interface Material { id: number; title?: string; name?: string; fileUrl?: string; type?: string; }

export default function AdminMaterialsScreen() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMaterials = async () => {
    try { const r = await api.get('/admin/materials'); setMaterials(r.data); }
    catch { Alert.alert('Error', 'Failed to load materials.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchMaterials(); }, []);

  const openFile = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${STRAPI_BASE_URL}${url}`;
    Linking.openURL(fullUrl).catch(() => Alert.alert('Error', 'Cannot open this file.'));
  };

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#f59e0b" /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={materials}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMaterials(); }} tintColor="#f59e0b" />}
        ListEmptyComponent={<Text style={s.empty}>No materials found.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.icon}><Text style={s.iconText}>📄</Text></View>
            <View style={s.info}>
              <Text style={s.title}>{item.title || item.name || 'Unnamed Material'}</Text>
              {item.type && <Text style={s.type}>{item.type}</Text>}
            </View>
            {item.fileUrl && (
              <TouchableOpacity style={s.downloadBtn} onPress={() => openFile(item.fileUrl!)}>
                <Text style={s.downloadText}>↓ Open</Text>
              </TouchableOpacity>
            )}
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
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#fffbeb', justifyContent: 'center', alignItems: 'center' },
  iconText: { fontSize: 20 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '800', color: '#1e293b' },
  type: { fontSize: 11, color: '#f59e0b', fontWeight: '700', marginTop: 3, textTransform: 'uppercase', letterSpacing: 1 },
  downloadBtn: { backgroundColor: '#fef9c3', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  downloadText: { fontSize: 12, fontWeight: '800', color: '#d97706' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
