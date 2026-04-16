import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, RefreshControl } from 'react-native';
import { fetchAboutPage, fetchStaffMembers } from '@/lib/strapi-api';

export default function AboutScreen() {
  const [about, setAbout] = useState<any>(null);
  const [leadership, setLeadership] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [a, l] = await Promise.all([fetchAboutPage(), fetchStaffMembers({ leadership: true })]);
    setAbout(a); setLeadership(l);
    setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      {/* History */}
      {about && (
        <>
          <View style={s.hero}>
            <Text style={s.eyebrow}>OUR STORY</Text>
            <Text style={s.heroTitle}>{about.historyTitle || 'About Our School'}</Text>
            {about.historyImage ? <Image source={{ uri: about.historyImage }} style={s.historyImage} resizeMode="cover" /> : null}
            {about.historyBody ? <Text style={s.bodyText}>{about.historyBody}</Text> : null}
          </View>

          {/* Stats */}
          {about.stats && (
            <View style={s.statsRow}>
              {[
                { v: about.stats.students, l: 'Students' },
                { v: about.stats.years, l: 'Years' },
                { v: about.stats.programs, l: 'Programs' },
                { v: about.stats.awards, l: 'Awards' },
              ].filter(({ v }) => v).map(({ v, l }) => (
                <View key={l} style={s.statCard}>
                  <Text style={s.statValue}>{v}+</Text>
                  <Text style={s.statLabel}>{l}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Mission & Vision */}
          <View style={s.section}>
            {about.missionText && (
              <View style={s.mvCard}>
                <View style={s.mvHeader}><Text style={s.mvIcon}>🎯</Text><Text style={s.mvLabel}>MISSION</Text></View>
                <Text style={s.mvText}>{about.missionText}</Text>
              </View>
            )}
            {about.visionText && (
              <View style={[s.mvCard, { borderTopColor: '#10b981' }]}>
                <View style={s.mvHeader}><Text style={s.mvIcon}>🔭</Text><Text style={[s.mvLabel, { color: '#10b981' }]}>VISION</Text></View>
                <Text style={s.mvText}>{about.visionText}</Text>
              </View>
            )}
            {/* Values */}
            {about.values?.length > 0 && (
              <View style={s.valuesSection}>
                <Text style={s.sectionTitle}>Our Core Values</Text>
                {about.values.map((v: any, i: number) => (
                  <View key={v.id || i} style={s.valueRow}>
                    <View style={s.valueDot} />
                    <Text style={s.valueText}>{typeof v === 'string' ? v : v.text || v.value || JSON.stringify(v)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Principal Message */}
          {about.principalMessage && (
            <View style={s.principalCard}>
              {about.principalImage ? <Image source={{ uri: about.principalImage }} style={s.principalImage} resizeMode="cover" /> : null}
              <Text style={s.principalQuote}>"{about.principalMessage}"</Text>
              <Text style={s.principalName}>— {about.principalName}</Text>
              {about.principalRole && <Text style={s.principalRole}>{about.principalRole}</Text>}
            </View>
          )}
        </>
      )}

      {/* Leadership Team */}
      {leadership.length > 0 && (
        <View style={s.section}>
          <Text style={s.eyebrow}>LEADERSHIP</Text>
          <Text style={s.sectionTitle}>Our Team</Text>
          {leadership.map(member => (
            <View key={member.id} style={s.leaderCard}>
              {member.image ? <Image source={{ uri: member.image }} style={s.leaderImage} resizeMode="cover" /> : <View style={[s.leaderImage, { backgroundColor: '#1e3a5f', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 28 }}>👤</Text></View>}
              <View style={{ flex: 1 }}>
                <Text style={s.leaderName}>{member.name}</Text>
                <Text style={s.leaderRole}>{member.role}</Text>
                {member.bio && <Text style={s.leaderBio} numberOfLines={3}>{member.bio}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: '#0f172a', padding: 28, paddingTop: 40 },
  eyebrow: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { color: '#f8fafc', fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 20 },
  historyImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 20 },
  bodyText: { color: '#94a3b8', fontSize: 14, lineHeight: 24, fontWeight: '500' },
  statsRow: { flexDirection: 'row', backgroundColor: '#2563eb', padding: 20, gap: 0 },
  statCard: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900' },
  statLabel: { color: '#bfdbfe', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  section: { padding: 24 },
  mvCard: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 14, borderTopWidth: 4, borderTopColor: '#2563eb', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  mvHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  mvIcon: { fontSize: 22 },
  mvLabel: { fontSize: 11, fontWeight: '900', color: '#2563eb', letterSpacing: 2 },
  mvText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },
  valuesSection: { marginTop: 8 },
  sectionTitle: { fontSize: 22, fontWeight: '900', color: '#1e293b', marginBottom: 16 },
  valueRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  valueDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6', marginTop: 6 },
  valueText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 22 },
  principalCard: { margin: 24, backgroundColor: '#0f172a', borderRadius: 24, padding: 28, alignItems: 'center' },
  principalImage: { width: 100, height: 100, borderRadius: 50, marginBottom: 20 },
  principalQuote: { color: '#cbd5e1', fontSize: 14, fontStyle: 'italic', lineHeight: 22, textAlign: 'center', marginBottom: 16 },
  principalName: { color: '#f8fafc', fontSize: 16, fontWeight: '900' },
  principalRole: { color: '#60a5fa', fontSize: 12, fontWeight: '600', marginTop: 4 },
  leaderCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  leaderImage: { width: 72, height: 72, borderRadius: 20 },
  leaderName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  leaderRole: { fontSize: 12, color: '#3b82f6', fontWeight: '600', marginTop: 3 },
  leaderBio: { fontSize: 12, color: '#64748b', lineHeight: 18, marginTop: 6 },
});
