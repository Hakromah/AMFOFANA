import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface DashboardStats {
  courseCount: number;
  attendance: number;
  materials: number;
  averageGrade: string;
  upcomingExam: { name: string; date: string; time?: string } | null;
  recentActivity: { title: string; timestamp: string }[];
}

const STAT_ITEMS = (s: DashboardStats) => [
  { label: 'Active Courses', value: s.courseCount, icon: '📚', color: '#3b82f6', bg: '#eff6ff' },
  { label: 'Attendance', value: `${s.attendance}%`, icon: '✅', color: '#10b981', bg: '#f0fdf4' },
  { label: 'Resources', value: s.materials, icon: '📄', color: '#f59e0b', bg: '#fffbeb' },
  { label: 'Avg Grade', value: s.averageGrade, icon: '🏆', color: '#8b5cf6', bg: '#f5f3ff' },
];

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    courseCount: 0, attendance: 0, materials: 0, averageGrade: 'N/A',
    upcomingExam: null, recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes] = await Promise.all([api.get('/student/dashboard-stats')]);
      setStats(statsRes.data);
    } catch (e) {
      console.error('[Student] Dashboard:', e);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={s.loadingText}>Loading Dashboard...</Text>
    </View>
  );

  const firstName = (user?.name || user?.username || 'Student').split(' ')[0];

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#3b82f6" />}
    >
      {/* Welcome Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Welcome back,</Text>
          <Text style={s.name}>{firstName} 👋</Text>
          <Text style={s.term}>Term 2 · 2026 · System Active</Text>
        </View>
        <View style={s.liveBadge}><View style={s.liveDot} /><Text style={s.liveText}>LIVE</Text></View>
      </View>

      {/* Stats Grid */}
      <Text style={s.sectionTitle}>YOUR OVERVIEW</Text>
      <View style={s.statsGrid}>
        {STAT_ITEMS(stats).map(item => (
          <View key={item.label} style={[s.statCard, { borderTopColor: item.color }]}>
            <View style={[s.statIconBg, { backgroundColor: item.bg }]}>
              <Text style={s.statIcon}>{item.icon}</Text>
            </View>
            <Text style={[s.statValue, { color: item.color }]}>{String(item.value)}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Upcoming Exam */}
      <Text style={s.sectionTitle}>EXAM REMINDER</Text>
      <View style={s.examCard}>
        {stats.upcomingExam ? (
          <View style={s.examRow}>
            <View style={s.examIcon}><Text style={{ fontSize: 24 }}>⏰</Text></View>
            <View>
              <Text style={s.examName}>{stats.upcomingExam.name}</Text>
              <Text style={s.examDate}>
                {new Date(stats.upcomingExam.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                {stats.upcomingExam.time ? ` · ${stats.upcomingExam.time.slice(0, 5)}` : ''}
              </Text>
            </View>
          </View>
        ) : (
          <View style={s.noExamRow}>
            <Text style={{ fontSize: 28 }}>✅</Text>
            <View>
              <Text style={s.noExamTitle}>No Upcoming Exams</Text>
              <Text style={s.noExamSub}>You're all caught up!</Text>
            </View>
          </View>
        )}
      </View>

      {/* Recent Activity */}
      <Text style={s.sectionTitle}>RECENT ACTIVITY</Text>
      <View style={s.activityCard}>
        {stats.recentActivity.length > 0 ? (
          stats.recentActivity.map((a, i) => (
            <View key={i} style={[s.activityRow, i < stats.recentActivity.length - 1 && s.activityBorder]}>
              <View style={s.activityDot} />
              <View style={{ flex: 1 }}>
                <Text style={s.activityTitle}>{a.title}</Text>
                <Text style={s.activityTime}>{new Date(a.timestamp).toLocaleDateString()}</Text>
              </View>
              <Text style={s.activityArrow}>›</Text>
            </View>
          ))
        ) : (
          <Text style={s.emptyActivity}>No recent activity recorded.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 12 },
  loadingText: { color: '#64748b', fontWeight: '700', fontSize: 12, letterSpacing: 2 },
  header: { backgroundColor: '#0f172a', borderRadius: 24, padding: 24, marginBottom: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#64748b', fontSize: 13, fontWeight: '600' },
  name: { color: '#f8fafc', fontSize: 26, fontWeight: '900', letterSpacing: -0.5, marginTop: 2 },
  term: { color: '#475569', fontSize: 11, fontWeight: '600', marginTop: 6, textTransform: 'uppercase', letterSpacing: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1e293b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10b981' },
  liveText: { color: '#10b981', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 },
  examCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 20, marginBottom: 24 },
  examRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  examIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },
  examName: { color: '#f8fafc', fontSize: 15, fontWeight: '800' },
  examDate: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 4 },
  noExamRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  noExamTitle: { color: '#f8fafc', fontSize: 15, fontWeight: '800' },
  noExamSub: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 2 },
  activityCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  activityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3b82f6' },
  activityTitle: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  activityTime: { fontSize: 11, color: '#94a3b8', fontWeight: '600', marginTop: 2 },
  activityArrow: { color: '#cbd5e1', fontSize: 20, fontWeight: '900' },
  emptyActivity: { textAlign: 'center', padding: 20, color: '#94a3b8', fontSize: 13, fontWeight: '600' },
});
