import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
interface Profile { name: string; email: string; username: string; userId?: string; gender?: string; birthDate?: string; phoneNumber?: string; address?: string; }
export default function StudentProfileScreen() {
  const { user: ctxUser, logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fetch = async () => { try { const r = await api.get('/auth/me'); setProfile(r.data); } catch { Alert.alert('Error', 'Failed to load profile.'); } finally { setLoading(false); setRefreshing(false); } };
  useEffect(() => { fetch(); }, []);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;
  const data = profile || ctxUser;
  const fields = [
    { label: 'Full Name', value: data?.name || data?.username }, { label: 'Email', value: data?.email },
    { label: 'Student ID', value: (data as any)?.userId }, { label: 'Gender', value: (data as any)?.gender },
    { label: 'Date of Birth', value: (data as any)?.birthDate }, { label: 'Phone', value: (data as any)?.phoneNumber },
    { label: 'Address', value: (data as any)?.address },
  ].filter(f => f.value);
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}>
      <View style={s.avatarSection}>
        <View style={s.avatar}><Text style={s.avatarText}>{((data?.name || data?.username || 'S').charAt(0)).toUpperCase()}</Text></View>
        <Text style={s.name}>{data?.name || data?.username}</Text>
        <View style={s.roleBadge}><Text style={s.roleText}>STUDENT</Text></View>
      </View>
      <View style={s.infoCard}>
        <Text style={s.sectionTitle}>PROFILE INFORMATION</Text>
        {fields.map(({ label, value }) => (
          <View key={label} style={s.infoRow}><Text style={s.infoLabel}>{label}</Text><Text style={s.infoValue}>{value}</Text></View>
        ))}
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarSection: { alignItems: 'center', backgroundColor: '#0f172a', borderRadius: 24, padding: 32, marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '900' },
  name: { color: '#f8fafc', fontSize: 22, fontWeight: '900', marginBottom: 8 },
  roleBadge: { backgroundColor: '#1e3a5f', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  roleText: { color: '#60a5fa', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  infoCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 },
  infoRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  infoLabel: { fontSize: 10, fontWeight: '800', color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
});
