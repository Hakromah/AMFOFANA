import Intro from "./pages-sections/home-sections/Intro";
import AboutSection from "./pages-sections/home-sections/AboutSection";
import AcademicSection from "./pages-sections/home-sections/AcademicSection";
import StudentLife from "./pages-sections/home-sections/StudentLife";
import WhyChooseUs from "./pages-sections/home-sections/WhyChooseUs";
import VideoSection from "./pages-sections/home-sections/VideoSection";
import StaffSection from "./pages-sections/home-sections/StaffSection";
import TestimonialsSection from "./pages-sections/home-sections/TestimonialsSection";
import NewsSection from "./pages-sections/home-sections/NewsSection";

import {
  fetchHeroSlides,
  fetchBlogPosts,
  fetchStaffMembers,
  fetchTestimonials,
  fetchAcademicPrograms,
} from "@/lib/strapi-api";

export default async function Index() {
  // Fetch all home page data in parallel from Strapi
  const [heroSlides, { posts: newsItems }, featuredStaff, testimonials, programs] =
    await Promise.all([
      fetchHeroSlides(),
      fetchBlogPosts({ pageSize: 8 }),
      fetchStaffMembers({ featured: true }),
      fetchTestimonials(),
      fetchAcademicPrograms(),
    ]);

  return (
    <>
      <Intro slides={heroSlides} />
      <AboutSection />
      <AcademicSection programs={programs} />
      <StudentLife />
      <WhyChooseUs />
      <VideoSection />
      <StaffSection staffMembers={featuredStaff} />
      <TestimonialsSection testimonials={testimonials} />
      <NewsSection newsItems={newsItems} />
    </>
  );
}
