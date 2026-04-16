import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { fetchGalleryItems } from '@/lib/strapi-api';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2;
const CATS = ['All', 'Photo', 'Video', 'Events', 'Sports', 'Academic'];

export default function GalleryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');

  const load = async () => { const d = await fetchGalleryItems(); setItems(d); setLoading(false); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  const filtered = category === 'All' ? items : items.filter(i => (i.category || '').toLowerCase() === category.toLowerCase() || (i.type || '').toLowerCase() === category.toLowerCase());

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={s.container}>
      <FlatList horizontal data={CATS} keyExtractor={i => i} showsHorizontalScrollIndicator={false}
        style={s.filterRow} contentContainerStyle={s.filterList}
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.chip, category === item && s.chipActive]} onPress={() => setCategory(item)}>
            <Text style={[s.chipText, category === item && s.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />
      <FlatList data={filtered} keyExtractor={i => String(i.id)} numColumns={2}
        contentContainerStyle={s.grid}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
        ListEmptyComponent={<Text style={s.empty}>No gallery items found.</Text>}
        renderItem={({ item }) => (
          <View style={s.item}>
            {item.thumbnail || item.src ? (
              <Image source={{ uri: item.thumbnail || item.src }} style={s.image} resizeMode="cover" />
            ) : <View style={[s.image, { backgroundColor: '#1e3a5f', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 32 }}>🖼️</Text></View>}
            {item.type === 'video' && <View style={s.playOverlay}><Text style={s.playIcon}>▶</Text></View>}
            {item.title && <Text style={s.itemTitle} numberOfLines={1}>{item.title}</Text>}
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', maxHeight: 56 },
  filterList: { flexDirection: 'row', padding: 10, gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  chipTextActive: { color: '#fff' },
  grid: { padding: 16, gap: 14 },
  item: { width: ITEM_SIZE, marginRight: 14, backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  image: { width: '100%', height: ITEM_SIZE },
  playOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.35)' },
  playIcon: { color: '#fff', fontSize: 28 },
  itemTitle: { fontSize: 11, fontWeight: '700', color: '#1e293b', padding: 8 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
