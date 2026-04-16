import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, RefreshControl, TouchableOpacity, Linking } from 'react-native';
import { fetchContactInfo } from '@/lib/strapi-api';

export default function ContactScreen() {
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => { const d = await fetchContactInfo(); setInfo(d); setLoading(false); setRefreshing(false); };
  useEffect(() => { load(); }, []);

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={s.hero}>
        <Text style={s.eyebrow}>GET IN TOUCH</Text>
        <Text style={s.heroTitle}>Contact Us</Text>
        <Text style={s.heroSub}>We're here to answer any questions you may have about our school.</Text>
      </View>

      {info ? (
        <>
          {/* Address */}
          {info.address && (
            <View style={s.card}>
              <View style={s.cardIcon}><Text style={{ fontSize: 24 }}>📍</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardLabel}>ADDRESS</Text>
                <Text style={s.cardValue}>{info.address}</Text>
                {info.latitude && info.longitude && (
                  <TouchableOpacity style={s.mapBtn} onPress={() => Linking.openURL(`https://maps.google.com/?q=${info.latitude},${info.longitude}`)}>
                    <Text style={s.mapBtnText}>Open in Maps →</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Phones */}
          {info.phones?.length > 0 && (
            <View style={s.card}>
              <View style={s.cardIcon}><Text style={{ fontSize: 24 }}>📞</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardLabel}>PHONE</Text>
                {info.phones.map((p: string, i: number) => (
                  <TouchableOpacity key={i} onPress={() => Linking.openURL(`tel:${p}`)}>
                    <Text style={[s.cardValue, s.link]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Emails */}
          {info.emails?.length > 0 && (
            <View style={s.card}>
              <View style={s.cardIcon}><Text style={{ fontSize: 24 }}>✉️</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardLabel}>EMAIL</Text>
                {info.emails.map((e: string, i: number) => (
                  <TouchableOpacity key={i} onPress={() => Linking.openURL(`mailto:${e}`)}>
                    <Text style={[s.cardValue, s.link]}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Office Hours */}
          {info.officeHours && (
            <View style={s.card}>
              <View style={s.cardIcon}><Text style={{ fontSize: 24 }}>🕐</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardLabel}>OFFICE HOURS</Text>
                <Text style={s.cardValue}>{info.officeHours}</Text>
              </View>
            </View>
          )}

          {/* Social Links */}
          {info.socialLinks?.length > 0 && (
            <View style={s.socialSection}>
              <Text style={s.socialLabel}>FOLLOW US</Text>
              <View style={s.socialRow}>
                {info.socialLinks.map((link: any, i: number) => (
                  <TouchableOpacity key={i} style={s.socialBtn} onPress={() => Linking.openURL(link.url || link.link || '#')}>
                    <Text style={s.socialIcon}>{getSocialIcon(link.platform || link.label || '')}</Text>
                    <Text style={s.socialName}>{link.platform || link.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={s.noData}>
          <Text style={{ fontSize: 40 }}>📭</Text>
          <Text style={s.noDataText}>Contact information not available.</Text>
        </View>
      )}
    </ScrollView>
  );
}

function getSocialIcon(platform: string): string {
  const p = platform.toLowerCase();
  if (p.includes('facebook')) return '👥';
  if (p.includes('twitter') || p.includes('x')) return '🐦';
  if (p.includes('instagram')) return '📸';
  if (p.includes('youtube')) return '▶️';
  if (p.includes('linkedin')) return '💼';
  if (p.includes('whatsapp')) return '💬';
  return '🔗';
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { paddingBottom: 60 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: { backgroundColor: '#0f172a', padding: 32, paddingTop: 40 },
  eyebrow: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 8 },
  heroTitle: { color: '#f8fafc', fontSize: 28, fontWeight: '900', marginBottom: 10 },
  heroSub: { color: '#64748b', fontSize: 14, lineHeight: 22, fontWeight: '500' },
  card: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff', margin: 16, marginBottom: 0, borderRadius: 20, padding: 20, gap: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardIcon: { width: 50, height: 50, borderRadius: 14, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  cardLabel: { fontSize: 9, fontWeight: '900', color: '#3b82f6', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 6 },
  cardValue: { fontSize: 15, fontWeight: '700', color: '#1e293b', lineHeight: 24 },
  link: { color: '#2563eb' },
  mapBtn: { marginTop: 10, backgroundColor: '#eff6ff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, alignSelf: 'flex-start' },
  mapBtnText: { color: '#2563eb', fontWeight: '800', fontSize: 13 },
  socialSection: { margin: 16, backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  socialLabel: { fontSize: 9, fontWeight: '900', color: '#3b82f6', letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 16 },
  socialRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  socialBtn: { backgroundColor: '#f1f5f9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  socialIcon: { fontSize: 18 },
  socialName: { fontSize: 13, fontWeight: '700', color: '#1e293b' },
  noData: { padding: 60, alignItems: 'center', gap: 12 },
  noDataText: { color: '#94a3b8', fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
