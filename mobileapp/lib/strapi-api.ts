/**
 * All public Strapi API calls — mirrors frontend/lib/strapi-api.ts
 */
import strapi, { mediaUrl, richTextToString, formatDate } from './strapi';

// ─── Hero Slides ──────────────────────────────────────────────────────────────
export async function fetchHeroSlides() {
  try {
    const { data } = await strapi.get(
      '/hero-slides?populate[0]=image&populate[1]=cta_primary_label&populate[2]=cta_secondary_label&sort=sort_order:asc'
    );
    return data.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      image: mediaUrl(item.image),
      ctaPrimaryLabel: item.cta_primary_label?.text || 'Explore More',
      ctaSecondaryLabel: item.cta_secondary_label?.text || 'Admissions',
    }));
  } catch { return []; }
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────
export async function fetchBlogPosts(params?: { page?: number; pageSize?: number; category?: string }) {
  try {
    const filters = params?.category && params.category !== 'All'
      ? `&filters[category][$eq]=${encodeURIComponent(params.category)}`
      : '';
    const pagination = `&pagination[page]=${params?.page ?? 1}&pagination[pageSize]=${params?.pageSize ?? 100}`;
    const populate = `populate[0]=image&populate[1]=breadcrumb_item.image`;
    const { data } = await strapi.get(`/blog-posts?${populate}&sort=date:desc${filters}${pagination}`);
    return {
      posts: data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        excerpt: item.excerpt,
        content: richTextToString(item.content),
        date: formatDate(item.date),
        category: item.category,
        author: item.author,
        image: mediaUrl(item.image),
        slug: item.slug || String(item.id),
      })),
      total: data.meta?.pagination?.total ?? 0,
    };
  } catch { return { posts: [], total: 0 }; }
}

// ─── Staff Members ────────────────────────────────────────────────────────────
export async function fetchStaffMembers(filter?: { featured?: boolean; leadership?: boolean }) {
  try {
    let filterStr = '';
    if (filter?.featured) filterStr += '&filters[is_featured][$eq]=true';
    if (filter?.leadership) filterStr += '&filters[isLeadership][$eq]=true';
    const query = 'populate[image][populate]=*&populate[breadcrumb_item][populate]=*&sort=sort_order:asc';
    const { data } = await strapi.get(`/staff-members?${query}${filterStr}`);
    return data.data.map((item: any) => ({
      id: item.id,
      name: item.name,
      role: item.role,
      email: item.email,
      bio: item.bio,
      heading: item.heading,
      image: mediaUrl(item.image),
      isLeadership: item.is_leadership,
      isFeatured: item.is_featured,
    }));
  } catch { return []; }
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
export async function fetchTestimonials() {
  try {
    const { data } = await strapi.get('/testimonials?populate=image');
    return data.data.map((item: any) => ({
      id: item.id,
      type: item.type,
      quote: item.quote,
      name: item.name,
      role: item.role,
      image: mediaUrl(item.image),
    }));
  } catch { return []; }
}

// ─── Academic Programs ────────────────────────────────────────────────────────
export async function fetchAcademicPrograms() {
  try {
    const { data } = await strapi.get('/academic-programs?populate=image&sort=sort_order:asc');
    return data.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      image: mediaUrl(item.image),
      header: item.header,
      subheader: item.subheader,
    }));
  } catch { return []; }
}

// ─── Gallery ──────────────────────────────────────────────────────────────────
export async function fetchGalleryItems() {
  try {
    const { data } = await strapi.get('/gallery-items?populate[0]=src&populate[1]=thumbnail');
    return data.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      type: item.type,
      category: item.category,
      src: mediaUrl(item.src),
      thumbnail: mediaUrl(item.thumbnail),
    }));
  } catch { return []; }
}

// ─── Opportunities ────────────────────────────────────────────────────────────
export async function fetchOpportunities() {
  try {
    const { data } = await strapi.get(
      '/opportunities?populate[0]=image&populate[1]=requirements&populate[2]=benefits&sort=published_date:desc'
    );
    return data.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      image: mediaUrl(item.image),
      publishedDate: item.published_date,
      deadline: item.deadline,
      slug: item.slug,
      details: {
        intro: item.details_intro,
        requirements: (item.requirements ?? []).map((r: any) => r.text),
        benefits: (item.benefits ?? []).map((b: any) => b.text),
        howToApply: item.how_to_apply,
      },
    }));
  } catch { return []; }
}

// ─── About Page (Single Type) ─────────────────────────────────────────────────
export async function fetchAboutPage() {
  try {
    const { data } = await strapi.get(
      '/about-page?populate[0]=history_image&populate[1]=principal_image&populate[2]=values'
    );
    if (!data.data) return null;
    const a = data.data;
    return {
      historyTitle: a.history_title,
      historyBody: a.history_body,
      historyImage: mediaUrl(a.history_image),
      stats: {
        students: Number(a.stat_students),
        years: Number(a.stat_years),
        programs: Number(a.stat_programs),
        awards: Number(a.stat_awards),
      },
      missionText: a.mission_text,
      visionText: a.vision_text,
      values: a.values ?? [],
      principalName: a.principal_name,
      principalRole: a.principal_role,
      principalMessage: a.principal_message,
      principalImage: mediaUrl(a.principal_image),
    };
  } catch { return null; }
}

// ─── Contact Info (Single Type) ───────────────────────────────────────────────
export async function fetchContactInfo() {
  try {
    const { data } = await strapi.get(
      '/contact-info?populate[0]=phones&populate[1]=email&populate[2]=social_links'
    );
    if (!data.data) return null;
    const c = data.data;
    return {
      address: c.address,
      phones: (c.phones ?? []).map((p: any) => String(p.phones)),
      emails: (c.email ?? []).map((e: any) => e.address),
      officeHours: c.office_hours,
      latitude: c.latitude,
      longitude: c.longitude,
      socialLinks: c.social_links ?? [],
    };
  } catch { return null; }
}

// ─── Why Choose Us ────────────────────────────────────────────────────────────
export async function fetchWhyChooseUs() {
  try {
    const { data } = await strapi.get('/why-choose-us-section?populate=*');
    if (!data.data) return null;
    const w = data.data;
    return {
      subtitle: w.subtitle,
      title: w.title,
      description: w.description,
      image: mediaUrl(w.image),
      cards: (w.cards || []).map((c: any) => ({
        id: c.id,
        icon: c.icon,
        title: c.title,
        description: c.description,
      })),
    };
  } catch { return null; }
}

// ─── Student Life ─────────────────────────────────────────────────────────────
export async function fetchStudentLife() {
  try {
    const { data } = await strapi.get(
      '/student-life-section?populate[0]=image_1&populate[1]=image_2&populate[2]=image_3&populate[3]=image_4'
    );
    if (!data.data) return null;
    const s = data.data;
    return {
      heading: s.heading,
      description: s.description,
      schoolName: s.school_name,
      image1: mediaUrl(s.image_1),
      image2: mediaUrl(s.image_2),
      image3: mediaUrl(s.image_3),
      image4: mediaUrl(s.image_4),
    };
  } catch { return null; }
}

// ─── Video Section ────────────────────────────────────────────────────────────
export async function fetchVideoSection() {
  try {
    const { data } = await strapi.get('/video-section?populate=*');
    if (!data.data) return null;
    const v = data.data;
    return {
      title: v.title,
      video: mediaUrl(v.video),
      overlaySubtitle: v.overlay_subtitle,
      overlayQuote: v.overlay_quote,
      overlayAuthor: v.overlay_author,
    };
  } catch { return null; }
}

// ─── Academic Sections ────────────────────────────────────────────────────────
export async function fetchAcademicSections() {
  try {
    const { data } = await strapi.get(
      '/academic-sections?populate[0]=image&populate[1]=details&sort=sort_order:asc'
    );
    return data.data.map((item: any) => ({
      id: item.id,
      title: item.title,
      content: item.content,
      image: mediaUrl(item.image),
      details: (item.details ?? []).map((d: any) => d.text),
      header: item.header,
      subheader: item.subheader,
    }));
  } catch { return []; }
}
