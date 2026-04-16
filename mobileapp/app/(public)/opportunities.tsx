import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import { fetchOpportunities } from '@/lib/strapi-api';

export default function OpportunitiesScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const load = async () => { const d = await fetchOpportunities(); setItems(d); setLoading(false); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={s.container}>
      <FlatList data={items} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
        ListEmptyComponent={<Text style={s.empty}>No opportunities available.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.card} onPress={() => setSelected(item)} activeOpacity={0.85}>
            {item.image ? <Image source={{ uri: item.image }} style={s.cardImg} resizeMode="cover" /> : <View style={[s.cardImg, { backgroundColor: '#1e3a5f' }]} />}
            <View style={s.cardBody}>
              <Text style={s.cardTitle}>{item.title}</Text>
              {item.description && <Text style={s.cardDesc} numberOfLines={3}>{item.description}</Text>}
              <View style={s.cardFooter}>
                {item.deadline && <View style={s.deadlineBadge}><Text style={s.deadlineText}>📅 Deadline: {new Date(item.deadline).toLocaleDateString()}</Text></View>}
                <Text style={s.readMore}>View Details →</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.modalContainer}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setSelected(null)} style={s.closeBtn}><Text style={s.closeText}>← Back</Text></TouchableOpacity>
            <Text style={s.modalHeaderTitle} numberOfLines={1}>Opportunity</Text>
          </View>
          {selected && (
            <ScrollView contentContainerStyle={s.modalScroll} showsVerticalScrollIndicator={false}>
              {selected.image && <Image source={{ uri: selected.image }} style={s.modalImg} resizeMode="cover" />}
              <View style={s.modalContent}>
                <Text style={s.modalTitle}>{selected.title}</Text>
                {selected.publishedDate && <Text style={s.modalMeta}>Published: {new Date(selected.publishedDate).toLocaleDateString()}</Text>}
                {selected.deadline && <View style={s.deadlineBadgeLg}><Text style={s.deadlineLgText}>⏰ Deadline: {new Date(selected.deadline).toLocaleDateString()}</Text></View>}
                {selected.description && <>
                  <Text style={s.detailLabel}>ABOUT</Text>
                  <Text style={s.detailText}>{selected.description}</Text>
                </>}
                {selected.details?.intro && <>
                  <Text style={s.detailLabel}>OVERVIEW</Text>
                  <Text style={s.detailText}>{selected.details.intro}</Text>
                </>}
                {selected.details?.requirements?.length > 0 && <>
                  <Text style={s.detailLabel}>REQUIREMENTS</Text>
                  {selected.details.requirements.map((r: string, i: number) => (
                    <View key={i} style={s.bulletRow}><Text style={s.bullet}>•</Text><Text style={s.bulletText}>{r}</Text></View>
                  ))}
                </>}
                {selected.details?.benefits?.length > 0 && <>
                  <Text style={s.detailLabel}>BENEFITS</Text>
                  {selected.details.benefits.map((b: string, i: number) => (
                    <View key={i} style={s.bulletRow}><Text style={s.bullet}>✓</Text><Text style={[s.bulletText, { color: '#10b981' }]}>{b}</Text></View>
                  ))}
                </>}
                {selected.details?.howToApply && <>
                  <Text style={s.detailLabel}>HOW TO APPLY</Text>
                  <Text style={s.detailText}>{selected.details.howToApply}</Text>
                </>}
                <TouchableOpacity style={s.applyBtn} onPress={() => setSelected(null)}>
                  <Text style={s.applyBtnText}>Contact School to Apply</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardImg: { width: '100%', height: 180 },
  cardBody: { padding: 20 },
  cardTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 8, lineHeight: 24 },
  cardDesc: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  deadlineBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  deadlineText: { fontSize: 11, fontWeight: '700', color: '#d97706' },
  readMore: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', paddingVertical: 14, paddingHorizontal: 16, gap: 12 },
  closeBtn: { padding: 4 },
  closeText: { color: '#60a5fa', fontWeight: '700', fontSize: 14 },
  modalHeaderTitle: { flex: 1, color: '#fff', fontWeight: '800', fontSize: 15 },
  modalScroll: { paddingBottom: 60 },
  modalImg: { width: '100%', height: 240 },
  modalContent: { padding: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', lineHeight: 30, marginBottom: 12 },
  modalMeta: { fontSize: 12, color: '#94a3b8', fontWeight: '600', marginBottom: 12 },
  deadlineBadgeLg: { backgroundColor: '#fef3c7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 20 },
  deadlineLgText: { fontSize: 13, fontWeight: '800', color: '#d97706' },
  detailLabel: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginTop: 20, marginBottom: 10 },
  detailText: { fontSize: 14, color: '#475569', lineHeight: 22, fontWeight: '500' },
  bulletRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  bullet: { fontSize: 14, color: '#3b82f6', fontWeight: '900', width: 16 },
  bulletText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },
  applyBtn: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 28 },
  applyBtnText: { color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: 0.5 },
});
