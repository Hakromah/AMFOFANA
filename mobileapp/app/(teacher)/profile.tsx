import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
interface Profile { name?: string; email?: string; username?: string; userId?: string; gender?: string; phoneNumber?: string; }
export default function TeacherProfileScreen() {
  const { user: ctxUser } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/auth/me'); setProfile(r.data); } catch { Alert.alert('Error', 'Failed.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#10b981" /></View>;
  const data = profile || ctxUser;
  const fields = [
    { label: 'Full Name', value: data?.name || (data as any)?.username }, { label: 'Email', value: (data as any)?.email },
    { label: 'Staff ID', value: (data as any)?.userId }, { label: 'Gender', value: (data as any)?.gender },
    { label: 'Phone', value: (data as any)?.phoneNumber },
  ].filter(f => f.value);
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}>
      <View style={s.header}>
        <View style={s.avatar}><Text style={s.avatarText}>{((data?.name || (data as any)?.username || 'T').charAt(0)).toUpperCase()}</Text></View>
        <Text style={s.name}>{data?.name || (data as any)?.username}</Text>
        <View style={s.badge}><Text style={s.badgeText}>TEACHER</Text></View>
      </View>
      <View style={s.card}>
        <Text style={s.sectionTitle}>PROFILE INFORMATION</Text>
        {fields.map(({ label, value }) => (
          <View key={label} style={s.row}><Text style={s.label}>{label}</Text><Text style={s.value}>{value}</Text></View>
        ))}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#0f172a', borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  name: { color: '#f8fafc', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  badge: { backgroundColor: '#064e3b', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }, badgeText: { color: '#34d399', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 },
  row: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  label: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
});
