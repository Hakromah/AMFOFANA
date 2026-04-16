import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, RefreshControl, TouchableOpacity } from 'react-native';
import { fetchBlogPosts } from '@/lib/strapi-api';

const CATEGORIES = ['All', 'News', 'Events', 'Announcements', 'Academic'];

export default function BlogScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [category, setCategory] = useState('All');

  const load = async (cat = category) => {
    const { posts: p } = await fetchBlogPosts({ pageSize: 50, category: cat });
    setPosts(p); setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  const selectCategory = (cat: string) => { setCategory(cat); setLoading(true); load(cat); };

  return (
    <View style={s.container}>
      {/* Category Filter */}
      <View style={s.filterRow}>
        <FlatList horizontal data={CATEGORIES} keyExtractor={i => i} showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.filterChip, category === item && s.filterChipActive]} onPress={() => selectCategory(item)}>
              <Text style={[s.filterText, category === item && s.filterTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View> : (
        <FlatList data={posts} keyExtractor={i => String(i.id)}
          contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
          ListEmptyComponent={<Text style={s.empty}>No posts found.</Text>}
          renderItem={({ item }) => (
            <View style={s.card}>
              {item.image ? <Image source={{ uri: item.image }} style={s.cardImage} resizeMode="cover" /> : <View style={[s.cardImage, { backgroundColor: '#1e3a5f' }]} />}
              <View style={s.cardContent}>
                <View style={s.cardMeta}>
                  {item.category && <Text style={s.cardCategory}>{item.category}</Text>}
                  {item.date && <Text style={s.cardDate}>{item.date}</Text>}
                </View>
                <Text style={s.cardTitle}>{item.title}</Text>
                {item.excerpt && <Text style={s.cardExcerpt} numberOfLines={3}>{item.excerpt}</Text>}
                {item.author && <Text style={s.cardAuthor}>By {item.author}</Text>}
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  filterRow: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  filterList: { flexDirection: 'row', padding: 12, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0' },
  filterChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#64748b' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardImage: { width: '100%', height: 200 },
  cardContent: { padding: 20 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  cardCategory: { fontSize: 10, fontWeight: '900', color: '#2563eb', letterSpacing: 2, textTransform: 'uppercase' },
  cardDate: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', lineHeight: 24, marginBottom: 10 },
  cardExcerpt: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 12 },
  cardAuthor: { fontSize: 11, color: '#94a3b8', fontWeight: '700' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
