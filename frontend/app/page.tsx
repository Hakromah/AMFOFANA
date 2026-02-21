
import Intro from "./pages-sections/home-sections/Intro";
import AboutSection from "./pages-sections/home-sections/AboutSection";
import AcademicSection from "./pages-sections/home-sections/AcademicSection";
import StudentLife from "./pages-sections/home-sections/StudentLife";
import WhyChooseUs from "./pages-sections/home-sections/WhyChooseUs";
import VideoSection from "./pages-sections/home-sections/VideoSection";
import StaffSection from "./pages-sections/home-sections/StaffSection";
import TestimonialsSection from "./pages-sections/home-sections/TestimonialsSection";
import NewsSection from "./pages-sections/home-sections/NewsSection";



export default function Index() {
  return (
    <>
        <Intro />
          <AboutSection />
           <AcademicSection /> 
            <StudentLife />
             <WhyChooseUs />
              <VideoSection />
               <StaffSection />
                 <TestimonialsSection />
                  <NewsSection />
    </>
  );
}
