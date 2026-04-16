import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import api from '@/lib/api';

interface Exam { id: number; name: string; date: string; term?: string; classe?: { name: string }; }

export default function AdminExamsScreen() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExams = async () => {
    try { const r = await api.get('/admin/exams'); setExams(r.data); }
    catch { Alert.alert('Error', 'Failed to load exams.'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchExams(); }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#ef4444" /></View>;

  return (
    <View style={s.container}>
      <FlatList
        data={exams}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExams(); }} tintColor="#ef4444" />}
        ListEmptyComponent={<Text style={s.empty}>No exams found.</Text>}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardLeft}>
              <Text style={s.examName}>{item.name}</Text>
              {item.classe?.name && <Text style={s.examClass}>Class: {item.classe.name}</Text>}
              {item.term && <Text style={s.examTerm}>{item.term}</Text>}
            </View>
            <View style={s.dateBadge}>
              <Text style={s.dateText}>{item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</Text>
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
  list: { padding: 16, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  cardLeft: { flex: 1 },
  examName: { fontSize: 15, fontWeight: '800', color: '#1e293b' },
  examClass: { fontSize: 12, color: '#64748b', fontWeight: '600', marginTop: 4 },
  examTerm: { fontSize: 10, color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  dateBadge: { backgroundColor: '#fef2f2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  dateText: { fontSize: 12, fontWeight: '800', color: '#ef4444' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
});
