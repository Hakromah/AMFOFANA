import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { fetchAcademicPrograms, fetchAcademicSections } from '@/lib/strapi-api';

export default function ProgramsScreen() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [tab, setTab] = useState<'programs' | 'sections'>('programs');

  const load = async () => {
    const [p, sec] = await Promise.all([fetchAcademicPrograms(), fetchAcademicSections()]);
    setPrograms(p); setSections(sec); setLoading(false); setRefreshing(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={s.container}>
      {/* Tab Toggle */}
      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === 'programs' && s.tabActive]} onPress={() => setTab('programs')}>
          <Text style={[s.tabText, tab === 'programs' && s.tabTextActive]}>Programs</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'sections' && s.tabActive]} onPress={() => setTab('sections')}>
          <Text style={[s.tabText, tab === 'sections' && s.tabTextActive]}>Academics</Text>
        </TouchableOpacity>
      </View>

      {tab === 'programs' ? (
        <FlatList data={programs} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
          ListEmptyComponent={<Text style={s.empty}>No programs available.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.programCard} onPress={() => setSelected(item)} activeOpacity={0.85}>
              {item.image ? <Image source={{ uri: item.image }} style={s.progImage} resizeMode="cover" /> : <View style={[s.progImage, { backgroundColor: '#1e3a5f' }]} />}
              <View style={s.progInfo}>
                {item.category && <Text style={s.category}>{item.category}</Text>}
                <Text style={s.progTitle}>{item.title}</Text>
                {item.subheader && <Text style={s.progSub}>{item.subheader}</Text>}
                <Text style={s.viewMore}>Learn More →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      ) : (
        <FlatList data={sections} keyExtractor={i => String(i.id)} contentContainerStyle={s.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#3b82f6" />}
          ListEmptyComponent={<Text style={s.empty}>No academic sections available.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={s.sectionCard} onPress={() => setSelected(item)} activeOpacity={0.85}>
              {item.image && <Image source={{ uri: item.image }} style={s.sectionImage} resizeMode="cover" />}
              <View style={s.sectionBody}>
                {item.header && <Text style={s.eyebrow}>{item.header}</Text>}
                <Text style={s.sectionTitle}>{item.title}</Text>
                {item.content && <Text style={s.sectionContent} numberOfLines={3}>{item.content}</Text>}
                <Text style={s.viewMore}>View Details →</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={s.modal}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setSelected(null)} style={s.backBtn}><Text style={s.backText}>← Back</Text></TouchableOpacity>
          </View>
          {selected && (
            <ScrollView contentContainerStyle={s.modalScroll}>
              {selected.image && <Image source={{ uri: selected.image }} style={s.modalImg} resizeMode="cover" />}
              <View style={s.modalBody}>
                {(selected.category || selected.header) && <Text style={s.eyebrow}>{selected.category || selected.header}</Text>}
                <Text style={s.modalTitle}>{selected.title}</Text>
                {selected.subheader && <Text style={s.modalSub}>{selected.subheader}</Text>}
                {(selected.description || selected.content) && <Text style={s.modalText}>{selected.description || selected.content}</Text>}
                {selected.details?.length > 0 && (
                  <View style={s.detailsList}>
                    <Text style={s.detailsLabel}>DETAILS</Text>
                    {selected.details.map((d: string, i: number) => (
                      <View key={i} style={s.detailRow}><Text style={s.detailBullet}>•</Text><Text style={s.detailText}>{d}</Text></View>
                    ))}
                  </View>
                )}
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
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: '#2563eb' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#64748b' },
  tabTextActive: { color: '#2563eb' },
  list: { padding: 16, gap: 16 },
  programCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  progImage: { width: '100%', height: 180 },
  progInfo: { padding: 20 },
  category: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  eyebrow: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 },
  progTitle: { fontSize: 20, fontWeight: '900', color: '#1e293b', marginBottom: 6 },
  progSub: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 12 },
  viewMore: { fontSize: 13, fontWeight: '700', color: '#2563eb' },
  sectionCard: { backgroundColor: '#fff', borderRadius: 20, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  sectionImage: { width: '100%', height: 160 },
  sectionBody: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#1e293b', marginBottom: 8 },
  sectionContent: { fontSize: 13, color: '#64748b', lineHeight: 20, marginBottom: 12 },
  empty: { textAlign: 'center', padding: 40, color: '#94a3b8', fontWeight: '600' },
  // Modal
  modal: { flex: 1, backgroundColor: '#f8fafc' },
  modalHeader: { backgroundColor: '#0f172a', paddingVertical: 14, paddingHorizontal: 16 },
  backBtn: { padding: 4 },
  backText: { color: '#60a5fa', fontWeight: '700', fontSize: 14 },
  modalScroll: { paddingBottom: 60 },
  modalImg: { width: '100%', height: 260 },
  modalBody: { padding: 24 },
  modalTitle: { fontSize: 26, fontWeight: '900', color: '#1e293b', lineHeight: 32, marginBottom: 8 },
  modalSub: { fontSize: 15, color: '#64748b', lineHeight: 22, marginBottom: 16 },
  modalText: { fontSize: 14, color: '#475569', lineHeight: 24 },
  detailsList: { marginTop: 20 },
  detailsLabel: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12 },
  detailRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  detailBullet: { color: '#3b82f6', fontWeight: '900', fontSize: 14, width: 14 },
  detailText: { flex: 1, fontSize: 14, color: '#475569', lineHeight: 20 },
});
