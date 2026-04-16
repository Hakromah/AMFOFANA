import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';

interface ReportDTO { totalStudents: number; totalTeachers: number; totalAdmins: number; totalClasses: number; totalExams: number; totalSubjects: number; }

export default function AdminReportsScreen() {
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async () => {
    try { const r = await api.get('/admin/reports/summary'); setReport(r.data); }
    catch { Alert.alert('Error', 'Failed to load report.'); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { fetch(); }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#2563eb" /></View>;

  const items = report ? [
    { label: 'Total Students', value: report.totalStudents, color: '#3b82f6', pct: null },
    { label: 'Total Teachers', value: report.totalTeachers, color: '#10b981', pct: null },
    { label: 'Total Admins', value: report.totalAdmins, color: '#f59e0b', pct: null },
    { label: 'Total Classes', value: report.totalClasses, color: '#8b5cf6', pct: null },
    { label: 'Total Exams', value: report.totalExams, color: '#ef4444', pct: null },
    { label: 'Total Subjects', value: report.totalSubjects, color: '#ec4899', pct: null },
  ] : [];

  const total = report ? report.totalStudents + report.totalTeachers + report.totalAdmins : 1;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor="#2563eb" />}
    >
      <View style={s.headerCard}>
        <Text style={s.headerTitle}>Academic Analytics</Text>
        <Text style={s.headerSub}>Full system report overview</Text>
      </View>

      {/* User Distribution */}
      {report && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>USER DISTRIBUTION</Text>
          {[
            { label: 'Students', value: report.totalStudents, color: '#3b82f6' },
            { label: 'Teachers', value: report.totalTeachers, color: '#10b981' },
            { label: 'Admins', value: report.totalAdmins, color: '#f59e0b' },
          ].map(item => {
            const pct = Math.round((item.value / (total || 1)) * 100);
            return (
              <View key={item.label} style={s.barRow}>
                <View style={s.barLabel}>
                  <Text style={s.barName}>{item.label}</Text>
                  <Text style={[s.barValue, { color: item.color }]}>{item.value}</Text>
                </View>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct}%`, backgroundColor: item.color }]} />
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Stats */}
      <Text style={s.sectionTitle}>INFRASTRUCTURE</Text>
      <View style={s.grid}>
        {items.map(item => (
          <View key={item.label} style={[s.statCard, { borderTopColor: item.color }]}>
            <Text style={[s.statValue, { color: item.color }]}>{item.value.toLocaleString()}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 24, marginBottom: 24 },
  headerTitle: { color: '#f8fafc', fontSize: 22, fontWeight: '900' },
  headerSub: { color: '#64748b', fontSize: 13, fontWeight: '600', marginTop: 4 },
  section: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 },
  barRow: { marginBottom: 16 },
  barLabel: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  barName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  barValue: { fontSize: 13, fontWeight: '900' },
  barTrack: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderTopWidth: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
});
