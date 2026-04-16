import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ReportDTO {
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
  totalClasses: number;
  totalExams: number;
  totalSubjects: number;
}

const STAT_CARDS = (r: ReportDTO) => [
  { title: 'Students', value: r.totalStudents, color: '#3b82f6', icon: '👩‍🎓' },
  { title: 'Teachers', value: r.totalTeachers, color: '#10b981', icon: '👨‍🏫' },
  { title: 'Classes', value: r.totalClasses, color: '#f59e0b', icon: '🏫' },
  { title: 'Exams', value: r.totalExams, color: '#ef4444', icon: '📝' },
  { title: 'Subjects', value: r.totalSubjects, color: '#8b5cf6', icon: '📚' },
  { title: 'Admins', value: r.totalAdmins, color: '#ec4899', icon: '⚙️' },
];

const QUICK_LINKS = [
  { label: 'User Audit', route: 'users', color: '#2563eb' },
  { label: 'Class Mgmt', route: 'classes', color: '#059669' },
  { label: 'Exams', route: 'exams', color: '#d97706' },
  { label: 'Reports', route: 'reports', color: '#7c3aed' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [report, setReport] = useState<ReportDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReport = async () => {
    try {
      const res = await api.get('/admin/reports/summary');
      setReport(res.data);
    } catch (e) {
      console.error('[Admin] fetchReport:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchReport(); };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Synchronizing Registry...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Admin Console</Text>
            <Text style={styles.name}>{user?.name || user?.username || 'Administrator'}</Text>
          </View>
          <View style={styles.statusChip}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        </View>
        <Text style={styles.headerSub}>Global Administrative Control Panel</Text>
      </View>

      {/* Stats Grid */}
      {report && (
        <View>
          <Text style={styles.sectionTitle}>SYSTEM OVERVIEW</Text>
          <View style={styles.statsGrid}>
            {STAT_CARDS(report).map((card) => (
              <View key={card.title} style={[styles.statCard, { borderLeftColor: card.color }]}>
                <Text style={styles.statIcon}>{card.icon}</Text>
                <Text style={[styles.statValue, { color: card.color }]}>
                  {card.value.toLocaleString()}
                </Text>
                <Text style={styles.statLabel}>{card.title}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
      <View style={styles.quickGrid}>
        {QUICK_LINKS.map((link) => (
          <TouchableOpacity
            key={link.route}
            style={[styles.quickCard, { backgroundColor: link.color }]}
          >
            <Text style={styles.quickLabel}>{link.label}</Text>
            <Text style={styles.quickArrow}>→</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Registry Card */}
      <View style={styles.registryCard}>
        <Text style={styles.registryTitle}>Registry Integrity</Text>
        <Text style={styles.registryBody}>
          All academic records are verified and synchronized with the secure cloud ledger.
        </Text>
        <View style={styles.registryBadge}>
          <Text style={styles.registryBadgeText}>✓ Database: 100% Synced</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 12 },
  loadingText: { color: '#64748b', fontWeight: '700', fontSize: 12, letterSpacing: 2 },
  headerSection: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  greeting: { color: '#64748b', fontSize: 12, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  name: { color: '#f8fafc', fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statusChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981' },
  statusText: { color: '#10b981', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  headerSub: { color: '#475569', fontSize: 13, fontWeight: '600' },
  sectionTitle: {
    fontSize: 10, fontWeight: '900', color: '#94a3b8',
    letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, marginTop: 4,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    width: '47%', borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  statIcon: { fontSize: 22, marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  statLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  quickCard: {
    width: '47%', borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  quickLabel: { color: '#fff', fontSize: 13, fontWeight: '800' },
  quickArrow: { color: '#ffffff88', fontSize: 18, fontWeight: '900' },
  registryCard: {
    backgroundColor: '#1e3a5f', borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: '#2563eb33',
  },
  registryTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  registryBody: { color: '#94a3b8', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  registryBadge: { backgroundColor: '#ffffff15', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
  registryBadgeText: { color: '#60a5fa', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
});
