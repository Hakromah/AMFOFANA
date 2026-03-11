"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import type { Opportunity } from "@/types/strapi";

export default function OpportunitiesPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  const totalPages = Math.ceil(opportunities.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentOpportunities = opportunities.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  return (
    <div className="w-full min-h-screen bg-background lg:pb-20">
      {/* Breadcrumb Section */}
      <Breadcrumb
        title="Opportunities"
        description="Join our team, apply for scholarships, or lead student initiatives."
        image="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=2084&auto=format&fit=crop"
        alt="Opportunities"
      />

      {/* Main Content */}
      <section id="opportunities-list" className="py-[clamp(25px,3vw,80px)]">
        <div className="container px-5 md:px-[clamp(20px,5vw,60px)] mx-auto max-w-[1920px]">
          {/* Section Header */}
          <div className="mb-[clamp(30px,4vw,80px)]">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-12 w-1 bg-[#2857AE]"></div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                {opportunities?.[0]?.header}
              </h2>
            </div>
            <p className="text-lg text-gray-600 max-w-4xl leading-relaxed">
              {opportunities?.[0]?.subheader}
            </p>
          </div>

          {/* Opportunities List */}
          <div className="flex flex-col gap-[clamp(30px,3.5vw,120px)] min-h-[500px]">
            {currentOpportunities.length > 0 ? (
              currentOpportunities.map((opp) => (
                <div key={opp.id} className="w-full h-full relative group">
                  <Link href={`/opportunities/${opp.id}`}>
                    {/* Left Side: Index & Image */}
                    <div className="flex flex-col lg:flex-row gap-[clamp(20px,3.5vw,40px)] items-start">
                      <div className="flex-1 w-full lg:w-auto flex gap-6 relative">
                        <div className="text-[clamp(15px,2.5vw,30px)] max-sm:absolute z-50 max-sm:top-3 max-sm:left-3 font-normal max-sm:w-15 max-sm:h-10 max-sm:text-white max-sm:bg-primary w-[83px] h-[63px] rounded-[10px] bg-primary/10 text-black flex items-center justify-center leading-none select-none">
                          {opp.index}
                        </div>
                        <div className="relative sm:h-[350px] max-sm:aspect-video w-full rounded-2xl overflow-hidden shadow-sm">
                          <Image
                            src={opp.image}
                            alt={opp.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
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
              ))
            ) : (
              <div className="text-center py-20 text-gray-500 text-lg">
                No active opportunities available at this moment.
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div>
              <div className="flex gap-[clamp(20px,3.5vw,28px)] items-center justify-center mt-[clamp(20px,4vw,50px)]">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`group/previous rounded-full h-12 w-12 max-md:w-10 max-md:h-10 duration-500 border border-primary/0 transition-colors ${currentPage === 1
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-primary cursor-pointer text-white lg:hover:text-primary lg:hover:bg-white lg:hover:border-primary'
                    }`}
                >
                  <ArrowLeft className={`h-6 w-6 duration-500 ${currentPage === 1 ? 'text-gray-500' : 'text-white lg:group-hover/previous:text-primary'}`} />
                </Button>

                {/* Page Numbers */}
                <div className="flex gap-3">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-[32px] rounded-md flex justify-center items-center text-[clamp(16px,3vw,18px)] font-semibold leading-normal cursor-pointer transition-colors ${currentPage === pageNum
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-primary/10 text-black hover:bg-primary/20'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`group/next rounded-full h-12 w-12 max-md:w-10 max-md:h-10 duration-500 border border-primary/0 transition-colors ${currentPage === totalPages
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-primary cursor-pointer text-white lg:hover:text-black lg:hover:bg-white lg:hover:border-primary'
                    }`}
                >
                  <ArrowRight className={`h-6 w-6 duration-500 ${currentPage === totalPages ? 'text-gray-500' : 'text-white lg:group-hover/next:text-primary'}`} />
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}