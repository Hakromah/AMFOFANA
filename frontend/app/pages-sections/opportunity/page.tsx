import React from "react";
import StrapiImage from "@/components/StrapiImage";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import type { Opportunity } from "@/types/strapi";

interface OpportunitiesPageProps {
  opportunities?: Opportunity[];
}

export default function OpportunitiesPage({ opportunities = [] }: OpportunitiesPageProps) {
  // Grab the breadcrumb from the first opportunity entry
  const breadcrumbData = opportunities[0]?.breadcrumb_item?.[0];

  return (
    <div className="w-full min-h-screen bg-background lg:pb-20">
      {/* Breadcrumb Section */}
      <Breadcrumb
        // Use Strapi data if available, otherwise fallback to defaults
        title={breadcrumbData?.breadcrumb_title || "Opportunities"}
        description={breadcrumbData?.description || "Join our team, apply for scholarships, or lead student initiatives."}
        image={breadcrumbData?.imageUrl || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"}
        alt={breadcrumbData?.breadcrumb_title || "Opportunities"}
      />


      {/* Main Content */}
      <section className="py-[clamp(25px,3vw,80px)]">
        <div className="container  px-5 md:px-[clamp(20px,5vw,60px)] mx-auto max-w-[1920px]">
          {/* Section Header */}
          <div className="mb-[clamp(30px,4vw,50px)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-1 bg-[#2857AE]"></div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {opportunities?.[0]?.header || "Check the latest Opportunities"}
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-4xl leading-relaxed">
              {opportunities?.[0]?.subheader || "Empowering students Where ambition meets opportunity: Providing the resources, scholarships, and networks students need to thrive in an evolving world with comprehensive education and innovative learning approaches"}
            </p>
          </div>

          {/* Opportunities List */}
          <div className="flex flex-col gap-[clamp(30px,3.5vw,120px)]">
            {opportunities.map((opp) => (
              <div key={opp.id} className="w-full h-full relative">
                <Link href={`/opportunities/${opp.slug}`}>
                  {/* Left Side: Index & Image */}
                  <div className="flex flex-col lg:flex-row gap-[clamp(20px,3.5vw,40px)] items-start">
                    <div className="flex-1 w-full lg:w-auto flex gap-6 relative">
                      <div className="text-[clamp(15px,2.5vw,30px)] max-sm:absolute z-50 max-sm:top-3 max-sm:left-3 font-normal max-sm:w-15 max-sm:h-10 max-sm:text-white max-sm:bg-primary w-[83px] h-[63px] rounded-[10px] bg-primary/10 text-black flex items-center justify-center leading-none select-none">
                        {opp.index}
                      </div>
                      {opp.image && (
                        <div className="relative h-[300px] w-full rounded-2xl overflow-hidden shadow-sm">
                          <StrapiImage
                            src={opp.image}
                            alt={opp.title}
                            fill
                            unoptimized
                            className="object-cover transition-transform duration-500 hover:scale-105"
                          />
                        </div>
                      )}
                    </div>

                    {/* Right Side: Content */}
                    <div className="flex-1 space-y-[clamp(12px,3.5vw,24px)] pt-2">
                      <h3 className="text-2xl font-bold text-gray-900 leading-tight">
                        {opp.title}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {opp.description}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-gray-500 border-b border-gray-100 pb-[clamp(12px,3.5vw,24px)] pt-2">
                        <span>published {opp.publishedDate}</span>
                        <div className="h-px bg-primary grow mx-4 hidden sm:block"></div>
                        <div>
                          Deadline {opp.deadline}{" "}
                          <span className="text-primary">{opp.dateNumber}</span>
                        </div>
                      </div>

                      <div>
                        <Button className="bg-[#2857AE] hover:bg-[#1e408a] cursor-pointer lg:hover:bg-secondary duration-500 lg:hover:text-primary border border-primary/0 lg:hover:border-primary rounded-full px-8">
                          See details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
          <div>
            <div className="flex gap-[clamp(20px,3.5vw,28px)] items-center justify-center mt-[clamp(20px,4vw,50px)]">
              <Button
                variant="outline"
                size="icon"
                className="group/previous cursor-pointer rounded-full h-12 w-12 max-md:w-10 max-md:h-10 bg-primary duration-500  text-white lg:border-primary border border-primary/0  lg:hover:text-primary lg:hover:bg-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6 lg:group-hover/previous:text-primary duration-500 text-white" />
              </Button>
              <div className="flex gap-3">
                <div className="w-7 h-[29px] flex justify-center bg-primary/10 items-center text-black text-[clamp(16px,3vw,18px)] font-semibold leading-normal">
                  1
                </div>
                <div className="w-7 h-[29px] flex justify-center bg-primary/10 items-center text-black text-[clamp(16px,3vw,18px)] font-semibold leading-normal">
                  2
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="group/next cursor-pointer rounded-full h-12 w-12 max-md:w-10 max-md:h-10 bg-primary duration-500  lg:border-primary border border-primary/0  text-white lg:hover:text-black lg:hover:bg-white transition-colors"
              >
                <ArrowRight className="h-6 w-6 lg:group-hover/next:text-primary duration-500 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
