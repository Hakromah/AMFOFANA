import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, RefreshControl, TextInput, TouchableOpacity } from 'react-native';
import { fetchStaffMembers } from '@/lib/strapi-api';

export default function StaffScreen() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => { const d = await fetchStaffMembers(); setStaff(d); setLoading(false); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  const filtered = staff.filter(m => (m.name || '').toLowerCase().includes(search.toLowerCase()) || (m.role || '').toLowerCase().includes(search.toLowerCase()));

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={s.container}>
      <View style={s.searchBox}>
        <TextInput style={s.searchInput} placeholder="Search staff by name or role..." placeholderTextColor="#94a3b8" value={search} onChangeText={setSearch} />
      </View>
      <FlatList data={filtered} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
        ListEmptyComponent={<Text style={s.empty}>No staff members found.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.image ? <Image source={{ uri: item.image }} style={s.avatar} resizeMode="cover" /> : <View style={[s.avatar, { backgroundColor: '#1e3a5f', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 28 }}>👤</Text></View>}
            <View style={s.info}>
              {item.heading && <Text style={s.heading}>{item.heading}</Text>}
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.role}>{item.role}</Text>
              {item.bio && <Text style={s.bio} numberOfLines={2}>{item.bio}</Text>}
              {item.email && <Text style={s.email}>✉ {item.email}</Text>}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBox: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  searchInput: { backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '600', color: '#1e293b' },
  list: { padding: 16, gap: 14 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, flexDirection: 'row', gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  avatar: { width: 80, height: 80, borderRadius: 22 },
  info: { flex: 1 },
  heading: { fontSize: 9, fontWeight: '900', color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 3 },
  name: { fontSize: 16, fontWeight: '900', color: '#1e293b' },
  role: { fontSize: 12, color: '#3b82f6', fontWeight: '700', marginTop: 3 },
  bio: { fontSize: 12, color: '#64748b', lineHeight: 18, marginTop: 8 },
  email: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 8 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
