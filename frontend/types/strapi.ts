// ─────────────────────────────────────────────
// Strapi v5 base wrappers  (flat format – no `attributes` wrapper)
// ─────────────────────────────────────────────

/** Strapi v5 rich-text block (subset we need) */
export interface StrapiRichTextBlock {
   type: string;
   children: Array<{ type: string; text: string }>;
}

export interface StrapiMediaFormat {
   url: string;
   width: number;
   height: number;
}

export interface StrapiMediaItem {
   id: number;
   url: string;
   alternativeText: string | null;
   name: string;
   formats?: {
      thumbnail?: StrapiMediaFormat;
      small?: StrapiMediaFormat;
      medium?: StrapiMediaFormat;
      large?: StrapiMediaFormat;
   };
}

/** Strapi v5 LIST response */
export interface StrapiListResponse<T> {
   data: T[];
   meta: {
      pagination: {
         page: number;
         pageSize: number;
         pageCount: number;
         total: number;
      };
   };
}

/** Strapi v5 SINGLE-TYPE response */
export interface StrapiSingleResponse<T> {
   data: T | null;
   meta: Record<string, unknown>;
}

// ─────────────────────────────────────────────
// Collection Types  (v5 flat – fields directly on the object)
// ─────────────────────────────────────────────

/** Shared link-items component shape */
export interface StrapiLinkItem {
   id: number;
   text: string;
   visibled: boolean | null;
}

/** hero-slides collection */
export interface StrapiHeroSlide {
   id: number;
   documentId?: string;
   title: string;
   subtitle: string;
   description: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   cta_primary_label: StrapiLinkItem | null;
   cta_secondary_label: StrapiLinkItem | null;
   sort_order: number;
}

/** blog-posts collection */
export interface StrapiBlogPost {
   id: number;
   documentId?: string;
   title: string;
   excerpt: string;
   /** Rich-text from Strapi v5 (array of blocks) OR plain string */
   content: StrapiRichTextBlock[] | string;
   date: string;
   category: string;
   author: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   slug: string;
}

/** staff-members collection */
export interface StrapiStaffMember {
   id: number;
   documentId?: string;
   name: string;
   role: string;
   email: string;
   bio: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   is_leadership: boolean;
   is_featured: boolean;
   sort_order: number;
}

/** testimonials collection */
export interface StrapiTestimonial {
   id: number;
   documentId?: string;
   type: string;
   quote: string;
   name: string;
   role: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
}

/** academic-programs collection */
export interface StrapiAcademicProgram {
   id: number;
   documentId?: string;
   title: string;
   category: string;
   description: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   sort_order: number;
   header: string;
   subheader: string;
}

/** gallery-items collection */
export interface StrapiGalleryItem {
   id: number;
   documentId?: string;
   title: string;
   type: 'image' | 'video';
   category: 'Campus' | 'Events' | 'Sports';
   src: StrapiMediaItem | StrapiMediaItem[] | null;
   thumbnail: StrapiMediaItem | StrapiMediaItem[] | null;
}

/** opportunities collection */
export interface StrapiOpportunity {
   id: number;
   documentId?: string;
   index: string;
   title: string;
   description: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   published_date: string;
   deadline: string;
   date_number: string;
   slug: string;
   details_intro: string;
   /** Repeatable component: { id, text }[] */
   requirements: Array<{ id: number; text: string }> | null;
   /** Repeatable component: { id, text }[] */
   benefits: Array<{ id: number; text: string }> | null;
   how_to_apply: string;
}

/** academic-sections collection */
export interface StrapiAcademicSection {
   id: number;
   documentId?: string;
   section_id: string;
   title: string;
   content: string;
   image: StrapiMediaItem | StrapiMediaItem[] | null;
   details: Array<{ id: number; text: string }> | null;
   sort_order: number;
   header: string;
   subheader: string;
}

/** academic-resources collection */
export interface StrapiAcademicResource {
   id: number;
   documentId?: string;
   name: string;
   file: StrapiMediaItem | StrapiMediaItem[] | null;
}

/** school-calendars collection */
export interface StrapiSchoolCalendar {
   id: number;
   documentId?: string;
   year: string;
   label: string | null;
   file: StrapiMediaItem | StrapiMediaItem[] | null;
}
// ─────────────────────────────────────────────
// Single Types  (v5 flat)
// ─────────────────────────────────────────────

export interface StrapiAboutPage {
   id: number;
   documentId?: string;
   history_title: string;
   history_body: string;
   history_image: StrapiMediaItem | StrapiMediaItem[] | null;
   stat_students: string;
   stat_years: string;
   stat_programs: string;
   stat_awards: string;
   mission_text: string;
   vision_text: string;
   values: Array<{ title: string; description: string }>;
   principal_name: string;
   principal_role: string;
   principal_message: string;
   principal_image: StrapiMediaItem | StrapiMediaItem[] | null;
   home_heading: string | null;
   home_description: string | null;
   home_stat: string | null;
   home_image_1: StrapiMediaItem | StrapiMediaItem[] | null;
   home_image_2: StrapiMediaItem | StrapiMediaItem[] | null;
}

export interface StrapiContactInfo {
   id: number;
   documentId?: string;
   address: string;
   phones: Array<{ number: string }>;
   emails: Array<{ address: string }>;
   office_hours: string;
   social_links: Array<{ name: string; href: string }>;
}

// ─────────────────────────────────────────────
// Normalised frontend DTOs  (flat, easy to use in components)
// ─────────────────────────────────────────────

export interface HeroSlide {
   id: number;
   title: string;
   subtitle: string;
   description: string;
   image: string;
   ctaPrimaryLabel: string;
   ctaPrimaryVisible: boolean;
   ctaSecondaryLabel: string;
   ctaSecondaryVisible: boolean;
}

export interface BlogPost {
   id: number;
   title: string;
   excerpt: string;
   content: string;  // always plain/HTML string in the DTO
   date: string;
   category: string;
   author: string;
   image: string;
   slug: string;
}

export interface StaffMember {
   id: number;
   name: string;
   role: string;
   email: string;
   bio: string;
   image: string;
   isLeadership: boolean;
   isFeatured: boolean;
}

export interface Testimonial {
   id: number;
   type: string;
   quote: string;
   name: string;
   role: string;
   image: string;
}

export interface AcademicProgram {
   id: number;
   title: string;
   category: string;
   description: string;
   image: string;
   sortOrder: number;
   header: string;
   subheader: string;

}

export interface GalleryItem {
   id: number;
   title: string;
   type: 'image' | 'video';
   category: 'Campus' | 'Events' | 'Sports';
   src: string;
   thumbnail?: string;
}

export interface Opportunity {
   id: number;
   index: string;
   title: string;
   description: string;
   image: string;
   publishedDate: string;
   deadline: string;
   dateNumber: string;
   slug: string;
   details: {
      intro: string;
      requirements: string[];
      benefits: string[];
      howToApply: string;
   };
}

export interface AcademicSection {
   id: number;
   sectionId: string;
   title: string;
   content: string;
   image: string;
   details: string[];
   header: string;
   subheader: string;
}

export interface AcademicResource {
   id: number;
   name: string;
   fileUrl: string;
}

export interface SchoolCalendar {
   id: number;
   year: string;
   label: string;
   fileUrl: string;
}

export interface AboutPageData {
   historyTitle: string;
   historyBody: string;
   historyImage: string;
   stats: { students: string; years: string; programs: string; awards: string };
   missionText: string;
   visionText: string;
   values: Array<{ title: string; description: string }>;
   principalName: string;
   principalRole: string;
   principalMessage: string;
   principalImage: string;
   homeHeading: string;
   homeDescription: string;
   homeStat: string;
   homeImage1: string;
   homeImage2: string;
}

export interface ContactInfoData {
   address: string;
   phones: string[];
   emails: string[];
   officeHours: string;
   socialLinks: Array<{ name: string; href: string }>;
}
