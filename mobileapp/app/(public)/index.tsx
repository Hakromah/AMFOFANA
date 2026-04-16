import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl, Image, TouchableOpacity, Dimensions, FlatList } from 'react-native';
import { router } from 'expo-router';
import { fetchHeroSlides, fetchAboutPage, fetchAcademicPrograms, fetchTestimonials, fetchStaffMembers, fetchBlogPosts, fetchWhyChooseUs } from '@/lib/strapi-api';

const { width } = Dimensions.get('window');

export default function PublicHome() {
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  const loadAll = async () => {
    const [slides, about, programs, testimonials, staff, newsData, whyUs] = await Promise.all([
      fetchHeroSlides(),
      fetchAboutPage(),
      fetchAcademicPrograms(),
      fetchTestimonials(),
      fetchStaffMembers({ featured: true }),
      fetchBlogPosts({ pageSize: 4 }),
      fetchWhyChooseUs(),
    ]);
    setData({ slides, about, programs, testimonials, staff, news: newsData.posts, whyUs });
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { loadAll(); }, []);

  if (loading) return (
    <View style={s.centered}>
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text style={s.loadingText}>Loading School Portal...</Text>
    </View>
  );

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll(); }} tintColor="#3b82f6" />}
    >
      {/* Hero Slider */}
      {data.slides?.length > 0 && (
        <View style={s.heroContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => setActiveSlide(Math.round(e.nativeEvent.contentOffset.x / width))}
          >
            {data.slides.map((slide: any) => (
              <View key={slide.id} style={[s.heroSlide, { width }]}>
                {slide.image ? (
                  <Image source={{ uri: slide.image }} style={s.heroImage} resizeMode="cover" />
                ) : null}
                <View style={s.heroOverlay}>
                  {slide.subtitle && <Text style={s.heroSubtitle}>{slide.subtitle.toUpperCase()}</Text>}
                  <Text style={s.heroTitle}>{slide.title}</Text>
                  {slide.description && <Text style={s.heroDesc} numberOfLines={2}>{slide.description}</Text>}
                  <TouchableOpacity style={s.heroCta} onPress={() => router.push('/(public)/programs')}>
                    <Text style={s.heroCtaText}>{slide.ctaPrimaryLabel}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
          {/* Dots */}
          <View style={s.dotsRow}>
            {data.slides.map((_: any, i: number) => (
              <View key={i} style={[s.dot, i === activeSlide && s.dotActive]} />
            ))}
          </View>
        </View>
      )}

      {/* Stats Strip */}
      {data.about && (
        <View style={s.statsStrip}>
          {[
            { v: data.about.stats?.students, l: 'Students' },
            { v: data.about.stats?.years, l: 'Years' },
            { v: data.about.stats?.programs, l: 'Programs' },
            { v: data.about.stats?.awards, l: 'Awards' },
          ].map(({ v, l }) => v ? (
            <View key={l} style={s.statItem}>
              <Text style={s.statValue}>{v}+</Text>
              <Text style={s.statLabel}>{l}</Text>
            </View>
          ) : null)}
        </View>
      )}

      {/* Why Choose Us */}
      {data.whyUs && (
        <View style={s.section}>
          <Text style={s.eyebrow}>{data.whyUs.subtitle || 'WHY US'}</Text>
          <Text style={s.sectionTitle}>{data.whyUs.title}</Text>
          {data.whyUs.description && <Text style={s.sectionBody}>{data.whyUs.description}</Text>}
          <View style={s.cardsGrid}>
            {(data.whyUs.cards || []).slice(0, 4).map((card: any) => (
              <View key={card.id} style={s.whyCard}>
                <Text style={s.whyIcon}>{card.icon || '⭐'}</Text>
                <Text style={s.whyTitle}>{card.title}</Text>
                <Text style={s.whyDesc} numberOfLines={3}>{card.description}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Academic Programs */}
      {data.programs?.length > 0 && (
        <View style={s.sectionDark}>
          <Text style={s.eyebrowLight}>ACADEMICS</Text>
          <Text style={s.sectionTitleLight}>Our Programs</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
            {data.programs.map((prog: any) => (
              <TouchableOpacity key={prog.id} style={s.programCard} onPress={() => router.push('/(public)/programs')}>
                {prog.image ? <Image source={{ uri: prog.image }} style={s.programImage} resizeMode="cover" /> : <View style={[s.programImage, { backgroundColor: '#1e3a5f' }]} />}
                <View style={s.programInfo}>
                  {prog.category && <Text style={s.programCategory}>{prog.category}</Text>}
                  <Text style={s.programTitle} numberOfLines={2}>{prog.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={s.viewAll} onPress={() => router.push('/(public)/programs')}>
            <Text style={s.viewAllText}>View All Programs →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Featured Staff */}
      {data.staff?.length > 0 && (
        <View style={s.section}>
          <Text style={s.eyebrow}>OUR TEAM</Text>
          <Text style={s.sectionTitle}>Featured Staff</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
            {data.staff.slice(0, 6).map((member: any) => (
              <TouchableOpacity key={member.id} style={s.staffCard} onPress={() => router.push('/(public)/staff')}>
                {member.image ? <Image source={{ uri: member.image }} style={s.staffImage} resizeMode="cover" /> : <View style={[s.staffImage, { backgroundColor: '#1e3a5f', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ fontSize: 28 }}>👤</Text></View>}
                <Text style={s.staffName} numberOfLines={1}>{member.name}</Text>
                <Text style={s.staffRole} numberOfLines={1}>{member.role}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Testimonials */}
      {data.testimonials?.length > 0 && (
        <View style={s.sectionDark}>
          <Text style={s.eyebrowLight}>TESTIMONIALS</Text>
          <Text style={s.sectionTitleLight}>What People Say</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hScroll}>
            {data.testimonials.map((t: any) => (
              <View key={t.id} style={s.testimonialCard}>
                <Text style={s.quote}>"</Text>
                <Text style={s.testimonialText} numberOfLines={5}>{t.quote}</Text>
                <View style={s.testimonialAuthor}>
                  {t.image ? <Image source={{ uri: t.image }} style={s.testimonialAvatar} /> : <View style={[s.testimonialAvatar, { backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' }]}><Text style={{ color: '#fff', fontWeight: '900' }}>{t.name?.charAt(0)}</Text></View>}
                  <View>
                    <Text style={s.testimonialName}>{t.name}</Text>
                    <Text style={s.testimonialRole}>{t.role}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Latest News */}
      {data.news?.length > 0 && (
        <View style={s.section}>
          <Text style={s.eyebrow}>LATEST</Text>
          <Text style={s.sectionTitle}>News & Updates</Text>
          {data.news.slice(0, 3).map((post: any) => (
            <TouchableOpacity key={post.id} style={s.newsCard} onPress={() => router.push('/(public)/blog')}>
              {post.image ? <Image source={{ uri: post.image }} style={s.newsImage} resizeMode="cover" /> : null}
              <View style={s.newsContent}>
                {post.category && <Text style={s.newsCategory}>{post.category}</Text>}
                <Text style={s.newsTitle} numberOfLines={2}>{post.title}</Text>
                <Text style={s.newsDate}>{post.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push('/(public)/blog')}>
            <Text style={s.viewAllBtnText}>View All News →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* CTA Banner */}
      <View style={s.ctaBanner}>
        <Text style={s.ctaTitle}>Ready to Join AMF?</Text>
        <Text style={s.ctaSub}>Explore opportunities and become part of our community.</Text>
        <View style={s.ctaBtns}>
          <TouchableOpacity style={s.ctaBtn} onPress={() => router.push('/(public)/opportunities')}>
            <Text style={s.ctaBtnText}>View Opportunities</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.ctaBtnOutline} onPress={() => router.push('/(public)/contact')}>
            <Text style={s.ctaBtnOutlineText}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.footer}>
        <Text style={s.footerText}>AMF School Management System © {new Date().getFullYear()}</Text>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', gap: 12 },
  loadingText: { color: '#64748b', fontWeight: '700', letterSpacing: 2, fontSize: 12 },
  // Hero
  heroContainer: { backgroundColor: '#0f172a' },
  heroSlide: { height: 420 },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 28, paddingBottom: 48 },
  heroSubtitle: { color: '#60a5fa', fontSize: 10, fontWeight: '900', letterSpacing: 3, marginBottom: 8 },
  heroTitle: { color: '#fff', fontSize: 30, fontWeight: '900', letterSpacing: -1, marginBottom: 8, lineHeight: 36 },
  heroDesc: { color: '#cbd5e1', fontSize: 14, fontWeight: '500', lineHeight: 22, marginBottom: 18 },
  heroCta: { backgroundColor: '#2563eb', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, alignSelf: 'flex-start' },
  heroCtaText: { color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 14 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#334155' },
  dotActive: { backgroundColor: '#3b82f6', width: 20 },
  // Stats
  statsStrip: { flexDirection: 'row', backgroundColor: '#2563eb', paddingVertical: 20, paddingHorizontal: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: -1 },
  statLabel: { color: '#bfdbfe', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 },
  // Sections
  section: { padding: 24, backgroundColor: '#f8fafc' },
  sectionDark: { padding: 24, backgroundColor: '#0f172a' },
  eyebrow: { fontSize: 10, fontWeight: '900', color: '#3b82f6', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 },
  eyebrowLight: { fontSize: 10, fontWeight: '900', color: '#60a5fa', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 },
  sectionTitle: { fontSize: 24, fontWeight: '900', color: '#1e293b', letterSpacing: -0.5, marginBottom: 16 },
  sectionTitleLight: { fontSize: 24, fontWeight: '900', color: '#f8fafc', letterSpacing: -0.5, marginBottom: 16 },
  sectionBody: { fontSize: 14, color: '#64748b', lineHeight: 22, fontWeight: '500', marginBottom: 20 },
  hScroll: { paddingRight: 16, gap: 14 },
  // Why Us
  cardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  whyCard: { width: '47%', backgroundColor: '#fff', borderRadius: 18, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  whyIcon: { fontSize: 28, marginBottom: 10 },
  whyTitle: { fontSize: 14, fontWeight: '800', color: '#1e293b', marginBottom: 6 },
  whyDesc: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  // Programs
  programCard: { width: 180, borderRadius: 16, overflow: 'hidden', backgroundColor: '#1e293b' },
  programImage: { width: '100%', height: 120 },
  programInfo: { padding: 12 },
  programCategory: { fontSize: 9, fontWeight: '800', color: '#60a5fa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  programTitle: { fontSize: 13, fontWeight: '800', color: '#f8fafc', lineHeight: 18 },
  viewAll: { marginTop: 16, alignSelf: 'center' },
  viewAllText: { color: '#60a5fa', fontWeight: '700', fontSize: 13 },
  // Staff
  staffCard: { width: 120, alignItems: 'center' },
  staffImage: { width: 80, height: 80, borderRadius: 24, marginBottom: 8 },
  staffName: { fontSize: 12, fontWeight: '800', color: '#1e293b', textAlign: 'center' },
  staffRole: { fontSize: 10, color: '#64748b', textAlign: 'center', fontWeight: '600', marginTop: 2 },
  // Testimonials
  testimonialCard: { width: 260, backgroundColor: '#1e293b', borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#334155' },
  quote: { fontSize: 40, color: '#3b82f6', lineHeight: 44, fontWeight: '900', marginBottom: -8 },
  testimonialText: { color: '#cbd5e1', fontSize: 13, lineHeight: 20, fontStyle: 'italic', marginBottom: 16 },
  testimonialAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  testimonialAvatar: { width: 36, height: 36, borderRadius: 12 },
  testimonialName: { color: '#f8fafc', fontSize: 12, fontWeight: '800' },
  testimonialRole: { color: '#64748b', fontSize: 10, fontWeight: '600', marginTop: 2 },
  // News
  newsCard: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  newsImage: { width: 96, height: 96 },
  newsContent: { flex: 1, padding: 14, justifyContent: 'center' },
  newsCategory: { fontSize: 9, fontWeight: '900', color: '#3b82f6', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  newsTitle: { fontSize: 13, fontWeight: '800', color: '#1e293b', lineHeight: 18, marginBottom: 4 },
  newsDate: { fontSize: 11, color: '#94a3b8', fontWeight: '600' },
  viewAllBtn: { backgroundColor: '#eff6ff', borderRadius: 14, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  viewAllBtnText: { color: '#2563eb', fontWeight: '800', fontSize: 13 },
  // CTA Banner
  ctaBanner: { backgroundColor: '#1e3a5f', margin: 20, borderRadius: 24, padding: 28, alignItems: 'center' },
  ctaTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  ctaSub: { color: '#93c5fd', fontSize: 13, fontWeight: '500', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  ctaBtns: { flexDirection: 'row', gap: 12 },
  ctaBtn: { backgroundColor: '#2563eb', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  ctaBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  ctaBtnOutline: { borderWidth: 1.5, borderColor: '#60a5fa', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  ctaBtnOutlineText: { color: '#60a5fa', fontWeight: '800', fontSize: 13 },
  // Footer
  footer: { paddingVertical: 24, alignItems: 'center' },
  footerText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
});
