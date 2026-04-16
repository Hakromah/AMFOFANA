import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface ClassItem { id: number; name: string; students?: any[]; }
interface Exam { id: number; name: string; date: string; term?: string; startTime?: string; classe?: { name: string }; }
interface Result { id: number; marks: number; grade?: string; student?: { name?: string; username?: string }; exam?: { name?: string; terme?: string; classe?: { name: string } }; }

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async () => {
    try {
      const [classRes, examRes, resultRes] = await Promise.all([
        api.get('/teacher/classes'),
        api.get('/teacher/exams'),
        api.get('/teacher/results/filter'),
      ]);
      setClasses(classRes.data);
      setExams(examRes.data);
      setResults(resultRes.data);
    } catch (e) {
      console.error('[Teacher] Dashboard:', e);
    } finally {
      setLoading(false); setRefreshing(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const totalStudents = useMemo(() => classes.reduce((acc, c) => acc + (c.students?.length || 0), 0), [classes]);
  const now = new Date(); now.setHours(0,0,0,0);
  const upcoming = useMemo(() => exams.filter(e => new Date(e.date) >= now).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0,3), [exams]);
  const recentResults = results.slice(0, 5);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#10b981" /><Text style={s.loadingText}>Syncing Registry...</Text></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAll(); }} tintColor="#10b981" />}
    >
      {/* Hero */}
      <View style={s.hero}>
        <View style={s.heroBadge}><View style={s.heroDot} /><Text style={s.heroBadgeText}>Academic Registry Live</Text></View>
        <Text style={s.heroGreeting}>Welcome back,</Text>
        <Text style={s.heroName}>{user?.name || user?.username || 'Educator'}</Text>
        <Text style={s.heroSub}>You have <Text style={s.heroEmphasis}>{classes.length} classes</Text> active this semester.</Text>
      </View>

      {/* Stats */}
      <Text style={s.sectionTitle}>YOUR METRICS</Text>
      <View style={s.statsRow}>
        {[
          { label: 'Classes', value: classes.length, color: '#3b82f6', icon: '🏫' },
          { label: 'Students', value: totalStudents, color: '#10b981', icon: '👩‍🎓' },
          { label: 'Exams', value: exams.length, color: '#f59e0b', icon: '📝' },
        ].map(item => (
          <View key={item.label} style={[s.statCard, { borderTopColor: item.color }]}>
            <Text style={s.statIcon}>{item.icon}</Text>
            <Text style={[s.statValue, { color: item.color }]}>{item.value}</Text>
            <Text style={s.statLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Upcoming Exams */}
      <Text style={s.sectionTitle}>UPCOMING TIMELINE</Text>
      <View style={s.card}>
        {upcoming.length > 0 ? upcoming.map((ex, i) => (
          <View key={ex.id} style={[s.examRow, i === 0 && s.examRowFirst, i < upcoming.length - 1 && s.examRowBorder]}>
            <View style={{ flex: 1 }}>
              <Text style={[s.examTerm, i === 0 && s.examTermFirst]}>{ex.term || 'Exam'}</Text>
              <Text style={[s.examName, i === 0 && s.examNameFirst]}>{ex.name}</Text>
              {ex.classe?.name && <Text style={[s.examClass, i === 0 && { color: '#93c5fd' }]}>{ex.classe.name}</Text>}
            </View>
            <View style={s.examDateBlock}>
              <Text style={[s.examDate, i === 0 && { color: '#fff' }]}>{new Date(ex.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</Text>
              {ex.startTime && <Text style={[s.examTime, i === 0 && { color: '#93c5fd' }]}>⏰ {ex.startTime.slice(0,5)}</Text>}
            </View>
          </View>
        )) : <Text style={s.empty}>No upcoming exams.</Text>}
      </View>

      {/* Recent Results */}
      <Text style={s.sectionTitle}>RECENT ACTIVITY</Text>
      <View style={s.card}>
        {recentResults.length > 0 ? recentResults.map((r, i) => (
          <View key={r.id} style={[s.resultRow, i < recentResults.length - 1 && s.resultBorder]}>
            <View style={s.resultAvatar}><Text style={s.resultAvatarText}>{((r.student?.username || r.student?.name || 'U').charAt(0)).toUpperCase()}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.resultName}>{r.student?.username || r.student?.name || 'Unknown'}</Text>
              <Text style={s.resultExam}>{r.exam?.name || 'Exam'}</Text>
            </View>
            <Text style={s.resultScore}>{r.marks}%</Text>
          </View>
        )) : <Text style={s.empty}>No results yet.</Text>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' }, content: { padding: 20, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc', gap: 12 },
  loadingText: { color: '#64748b', fontWeight: '700', fontSize: 12, letterSpacing: 2 },
  hero: { backgroundColor: '#0f172a', borderRadius: 24, padding: 28, marginBottom: 24 },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1e3a5f', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, alignSelf: 'flex-start', marginBottom: 16 },
  heroDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10b981' },
  heroBadgeText: { color: '#60a5fa', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  heroGreeting: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  heroName: { color: '#60a5fa', fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  heroSub: { color: '#475569', fontSize: 14, fontWeight: '600', marginTop: 8 },
  heroEmphasis: { color: '#f8fafc', fontWeight: '900' },
  sectionTitle: { fontSize: 10, fontWeight: '900', color: '#94a3b8', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderTopWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  statIcon: { fontSize: 22, marginBottom: 6 }, statValue: { fontSize: 24, fontWeight: '900', letterSpacing: -1 }, statLabel: { fontSize: 10, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  examRow: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  examRowFirst: { backgroundColor: '#2563eb' }, examRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  examTerm: { fontSize: 9, fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 2 },
  examTermFirst: { color: '#93c5fd' }, examName: { fontSize: 14, fontWeight: '800', color: '#1e293b' }, examNameFirst: { color: '#fff' },
  examClass: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 3 },
  examDateBlock: { alignItems: 'flex-end' }, examDate: { fontSize: 12, fontWeight: '900', color: '#1e293b' }, examTime: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  resultRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  resultBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  resultAvatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#f0fdf4', justifyContent: 'center', alignItems: 'center' },
  resultAvatarText: { fontSize: 16, fontWeight: '900', color: '#10b981' },
  resultName: { fontSize: 13, fontWeight: '800', color: '#1e293b' }, resultExam: { fontSize: 11, color: '#64748b', fontWeight: '600', marginTop: 2 },
  resultScore: { fontSize: 18, fontWeight: '900', color: '#1e293b' },
  empty: { padding: 20, textAlign: 'center', color: '#94a3b8', fontSize: 13, fontWeight: '600' },
});
