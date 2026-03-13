import React from "react";
import OpportunitiesPage from "@/app/pages-sections/opportunity/page";
import type { Metadata } from "next";
import { fetchOpportunities } from "@/lib/strapi-api";
import Breadcrumb from "@/components/Breadcrumb";

export const metadata: Metadata = {
    title: "Opportunities",
};

export default async function Page() {
    const opportunities = await fetchOpportunities();

    return <div>
         <Breadcrumb
                title="Opportunities"
                description="Join our team, apply for scholarships, or lead student initiatives."
                image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"
                alt="Opportunities"
              />
              <div className="container  px-5 md:px-[clamp(20px,5vw,60px)] mx-auto max-w-[1920px]">
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
          </div>

     <OpportunitiesPage opportunities={opportunities} />;
</div>
}
