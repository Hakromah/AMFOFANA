/**
 * Strapi v5 API helper functions
 *
 * Strapi v5 changed the response shape:
 *   v4: { data: [{ id, attributes: { ... } }] }
 *   v5: { data: [{ id, documentId, title, image: {...}, ... }] }  ← flat
 *
 * All fetch functions use the dedicated `lib/strapi.ts` Axios client.
 * Functions return normalised DTOs defined in `types/strapi.ts`.
 * Every function catches errors silently and returns [] / null so pages
 * always fall back to static data when Strapi is offline.
 */

import strapi, { getStrapiMediaUrl } from './strapi';
import type {
   StrapiListResponse,
   StrapiSingleResponse,
   StrapiHeroSlide,
   StrapiBlogPost,
   StrapiStaffMember,
   StrapiTestimonial,
   StrapiAcademicProgram,
   StrapiGalleryItem,
   StrapiOpportunity,
   StrapiAcademicSection,
   StrapiAcademicResource,
   StrapiSchoolCalendar,
   StrapiAboutPage,
   StrapiContactInfo,
   StrapiStudentLife,
   StrapiWhyChooseUs,
   StrapiVideoSection,
   StrapiFeatureCard,
   StrapiRichTextBlock,
   StrapiMediaItem,
   HeroSlide,
   BlogPost,
   StaffMember,
   Testimonial,
   AcademicProgram,
   GalleryItem,
   Opportunity,
   AcademicSection,
   AcademicResource,
   SchoolCalendar,
   AboutPageData,
   ContactInfoData,
   StudentLifeData,
   WhyChooseUsData,
   VideoSectionData,
} from '@/types/strapi';

// ─── Utility ──────────────────────────────────────────────────────────────────

/**
 * Strapi v5 returns media fields as EITHER:
 *   - A single object  { id, url, ... }
 *   - An array         [{ id, url, ... }]
 * This helper handles both shapes.
 */
function mediaUrl(item: StrapiMediaItem | StrapiMediaItem[] | null | undefined): string {
   if (!item) return '';
   // Array shape → take first element
   const media = Array.isArray(item) ? item[0] : item;
   if (!media?.url) return '';
   return getStrapiMediaUrl(media.url);
}


/**
 * Strapi v5 rich-text content is an array of block objects when the field
 * is a "Rich text (Blocks)" type. Convert it to plain text so existing
 * components that expect a string still work.
 */
function richTextToString(content: StrapiRichTextBlock[] | string | null | undefined): string {
   if (!content) return '';
   if (typeof content === 'string') return content;
   // Extract text from each paragraph block
   return content
      .map((block) =>
         block.children
            .filter((c) => c.type === 'text')
            .map((c) => c.text)
            .join('')
      )
      .filter(Boolean)
      .join('\n\n');
}

function formatDate(isoString: string | null | undefined): string {
   if (!isoString) return '';
   try {
      return new Date(isoString).toLocaleDateString('en-US', {
         month: 'short',
         day: 'numeric',
         year: 'numeric',
      });
   } catch {
      return isoString;
   }
}

// ─── Hero Slides ──────────────────────────────────────────────────────────────

export async function fetchHeroSlides(): Promise<HeroSlide[]> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiHeroSlide>>(
         '/hero-slides?populate[0]=image&populate[1]=cta_primary_label&populate[2]=cta_secondary_label&sort=sort_order:asc'
      );
      return data.data.map((item) => ({
         id: item.id,
         title: item.title,
         subtitle: item.subtitle,
         description: item.description,
         image: mediaUrl(item.image),
         ctaPrimaryLabel: item.cta_primary_label?.text || 'Explore More',
         ctaPrimaryVisible: item.cta_primary_label?.visibled === true,
         ctaSecondaryLabel: item.cta_secondary_label?.text || 'Admissions',
         ctaSecondaryVisible: item.cta_secondary_label?.visibled === true,
      }));
   } catch {
      return [];
   }
}

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export async function fetchBlogPosts(params?: {
   page?: number;
   pageSize?: number;
   category?: string;
}): Promise<{ posts: BlogPost[]; total: number }> {
   try {
      const filters =
         params?.category && params.category !== 'All'
            ? `&filters[category][$eq]=${encodeURIComponent(params.category)}`
            : '';
      const pagination = `&pagination[page]=${params?.page ?? 1}&pagination[pageSize]=${params?.pageSize ?? 100}`;
      const { data } = await strapi.get<StrapiListResponse<StrapiBlogPost>>(
         `/blog-posts?populate=image&sort=date:desc${filters}${pagination}`
      );
      return {
         posts: data.data.map((item) => ({
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
         total: data.meta.pagination.total,
      };
   } catch (err) {
      console.error('[Strapi] fetchBlogPosts error:', err);
      return { posts: [], total: 0 };
   }
}

export async function fetchBlogPostById(id: string): Promise<BlogPost | null> {
   try {
      // Strapi v5: try fetching by numeric id first
      const { data } = await strapi.get<StrapiListResponse<StrapiBlogPost>>(
         `/blog-posts?filters[id][$eq]=${id}&populate=image`
      );
      if (!data.data.length) return null;
      const item = data.data[0];
      return {
         id: item.id,
         title: item.title,
         excerpt: item.excerpt,
         content: richTextToString(item.content),
         date: formatDate(item.date),
         category: item.category,
         author: item.author,
         image: mediaUrl(item.image),
         slug: item.slug || String(item.id),
      };
   } catch {
      return null;
   }
}

// ─── Staff ────────────────────────────────────────────────────────────────────

export async function fetchStaffMembers(filter?: {
   featured?: boolean;
   leadership?: boolean;
}): Promise<StaffMember[]> {
   try {
      let filterStr = '';
      if (filter?.featured) filterStr += '&filters[is_featured][$eq]=true';
      if (filter?.leadership) filterStr += '&filters[isLeadership][$eq]=true';
      const { data } = await strapi.get<StrapiListResponse<StrapiStaffMember>>(
         `/staff-members?populate=image&sort=sort_order:asc${filterStr}`
      );
      return data.data.map((item) => ({
         id: item.id,
         name: item.name,
         role: item.role,
         email: item.email,
         bio: item.bio,
         image: mediaUrl(item.image),
         isLeadership: item.is_leadership,
         isFeatured: item.is_featured,
      }));
   } catch {
      return [];
   }
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

export async function fetchTestimonials(): Promise<Testimonial[]> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiTestimonial>>(
         '/testimonials?populate=image'
      );
      return data.data.map((item) => ({
         id: item.id,
         type: item.type,
         quote: item.quote,
         name: item.name,
         role: item.role,
         image: mediaUrl(item.image),
      }));
   } catch {
      return [];
   }
}

// ─── Academic Programs ────────────────────────────────────────────────────────

export async function fetchAcademicPrograms(): Promise<AcademicProgram[]> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiAcademicProgram>>(
         '/academic-programs?populate=image&sort=sort_order:asc'
      );
      return data.data.map((item) => ({
         id: item.id,
         title: item.title,
         category: item.category,
         description: item.description,
         image: mediaUrl(item.image),
         sortOrder: item.sort_order,
         header: item.header,
         subheader: item.subheader,
      }));
   } catch {
      return [];
   }
}

// ─── Gallery ──────────────────────────────────────────────────────────────────

export async function fetchGalleryItems(): Promise<GalleryItem[]> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiGalleryItem>>(
         '/gallery-items?populate[0]=src&populate[1]=thumbnail'
      );
      return data.data.map((item) => ({
         id: item.id,
         title: item.title,
         type: item.type,
         category: item.category,
         src: mediaUrl(item.src),
         thumbnail: mediaUrl(item.thumbnail) || undefined,
      }));
   } catch {
      return [];
   }
}

// ─── Opportunities ────────────────────────────────────────────────────────────

export async function fetchOpportunities(): Promise<Opportunity[]> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiOpportunity>>(
         '/opportunities?populate[0]=image&populate[1]=requirements&populate[2]=benefits&sort=published_date:desc'
      );
      return data.data.map(normalizeOpportunity);
   } catch {
      return [];
   }
}

export async function fetchOpportunityBySlug(slug: string): Promise<Opportunity | null> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiOpportunity>>(
         `/opportunities?filters[slug][$eq]=${encodeURIComponent(slug)}&populate[0]=image&populate[1]=requirements&populate[2]=benefits`
      );
      if (!data.data.length) return null;
      return normalizeOpportunity(data.data[0]);
   } catch {
      return null;
   }
}

function normalizeOpportunity(item: StrapiOpportunity): Opportunity {
   return {
      id: item.id,
      index: item.index,
      title: item.title,
      description: item.description,
      image: mediaUrl(item.image),
      publishedDate: item.published_date,
      deadline: item.deadline,
      dateNumber: item.date_number,
      slug: item.slug,
      details: {
         intro: item.details_intro,
         // Repeatable components return [{id, text}] — extract the text strings
         requirements: (item.requirements ?? []).map((r) => r.text),
         benefits: (item.benefits ?? []).map((b) => b.text),
         howToApply: item.how_to_apply,
      },
   };
}

// ─── Academic Sections ────────────────────────────────────────────────────────

export async function fetchAcademicSections(): Promise<AcademicSection[]> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiAcademicSection>>(
         '/academic-sections?populate=*&sort=sort_order:asc'
      );
      return data.data.map((item) => ({
         id: item.id,
         sectionId: item.section_id || String(item.id),
         title: item.title,
         content: item.content,
         image: mediaUrl(item.image),
         // details: item.details ?? [],
         details: (item.details ?? []).map((d: { id: number; text: string }) => d.text),
         header: item.header,
         subheader: item.subheader,
      }));
   } catch {
      return [];
   }
}

// ─── Academic Resources ───────────────────────────────────────────────────────

export async function fetchAcademicResources(): Promise<AcademicResource[]> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiAcademicResource>>(
         '/academic-resources?populate=file'
      );
      return data.data.map((item) => ({
         id: item.id,
         name: item.name,
         fileUrl: mediaUrl(item.file),
      }));
   } catch {
      return [];
   }
}

// ─── School Calendars ─────────────────────────────────────────────────────────

export async function fetchSchoolCalendars(): Promise<SchoolCalendar[]> {
   try {
      const { data } = await strapi.get<StrapiListResponse<StrapiSchoolCalendar>>(
         '/school-calendars?populate=file&sort=createdAt:desc'
      );
      return data.data.map((item) => ({
         id: item.id,
         year: item.year ?? '',
         label: item.label ?? 'School Calendar',
         fileUrl: mediaUrl(item.file),
      }));
   } catch {
      return [];
   }
}

// ─── About Page (Single Type) ─────────────────────────────────────────────────

export async function fetchAboutPage(): Promise<AboutPageData | null> {
   try {
      const { data } = await strapi.get<StrapiSingleResponse<StrapiAboutPage>>(
         '/about-page?populate[0]=history_image&populate[1]=principal_image&populate[2]=values&populate[3]=home_image_1&populate[4]=home_image_2'
      );
      if (!data.data) return null;
      const a = data.data;
      return {
         historyTitle: a.history_title,
         historyBody: a.history_body,
         historyImage: mediaUrl(a.history_image),
         stats: {
            students: a.stat_students,
            years: a.stat_years,
            programs: a.stat_programs,
            awards: a.stat_awards,
         },
         missionText: a.mission_text,
         visionText: a.vision_text,
         values: a.values ?? [],
         principalName: a.principal_name,
         principalRole: a.principal_role,
         principalMessage: a.principal_message,
         principalImage: mediaUrl(a.principal_image),
         homeHeading: a.home_heading ?? '',
         homeDescription: a.home_description ?? '',
         homeStat: a.home_stat ?? '',
         homeImage1: mediaUrl(a.home_image_1),
         homeImage2: mediaUrl(a.home_image_2),
      };
   } catch {
      return null;
   }
}

// ─── Contact Info (Single Type) ───────────────────────────────────────────────

export async function fetchContactInfo(): Promise<ContactInfoData | null> {
   try {
      const { data } = await strapi.get<StrapiSingleResponse<StrapiContactInfo>>(
         '/contact-info'
      );
      if (!data.data) return null;
      const c = data.data;
      return {
         address: c.address,
         phones: (c.phones ?? []).map((p) => p.number),
         emails: (c.emails ?? []).map((e) => e.address),
         officeHours: c.office_hours,
         socialLinks: c.social_links ?? [],
      };
   } catch {
      return null;
   }
}

// ─── Student Life (Single Type) ───────────────────────────────────────────────

export async function fetchStudentLife(): Promise<StudentLifeData | null> {
   try {
      const { data } = await strapi.get<StrapiSingleResponse<StrapiStudentLife>>(
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
   } catch {
      return null;
   }
}

// ─── Why Choose Us (Single Type) ──────────────────────────────────────────────

export async function fetchWhyChooseUs(): Promise<WhyChooseUsData | null> {
   try {
      const { data } = await strapi.get<StrapiSingleResponse<StrapiWhyChooseUs>>(
         '/why-choose-us-section?populate=*'
      );
      if (!data.data) return null;
      const w = data.data;
      return {
         subtitle: w.subtitle,
         title: w.title,
         description: w.description,
         image: mediaUrl(w.image),
         cards: (w.cards || []).map((c: StrapiFeatureCard) => ({
            id: c.id,
            icon: c.icon,
            title: c.title,
            description: c.description
         })),
      };
   } catch {
      return null;
   }
}

// ─── Video Section (Single Type) ──────────────────────────────────────────────

export async function fetchVideoSection(): Promise<VideoSectionData | null> {
   try {
      const { data } = await strapi.get<StrapiSingleResponse<StrapiVideoSection>>(
         '/video-section?populate=*'
      );
      if (!data.data) return null;
      const v = data.data;
      return {
         title: v.title,
         video: mediaUrl(v.video),
         overlaySubtitle: v.overlay_subtitle,
         overlayQuote: v.overlay_quote,
         overlayAuthor: v.overlay_author,
      };
   } catch {
      return null;
   }
}
