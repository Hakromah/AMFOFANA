import Intro from "@/components/home/Intro";
import AboutSection from "@/components/home/AboutSection";
import AcademicSection from "@/components/home/AcademicSection";
import StudentLife from "@/components/home/StudentLife";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import VideoSection from "@/components/home/VideoSection";
import StaffSection from "@/components/home/StaffSection";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import NewsSection from "@/components/home/NewsSection";

export default function HomePage() {
  return (
    <div className="overflow-clip">
      <Intro />
      {/* <AboutSection />
      <AcademicSection /> 
       <StudentLife />
        <WhyChooseUs />
         <VideoSection />
          <StaffSection />*/}
           <TestimonialsSection />
     
      {/* 
     
     
     
      <NewsSection /> */}
    </div>
  );
}
