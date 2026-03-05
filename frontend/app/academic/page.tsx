import React from "react";
import AcademicPage from "@/app/pages-sections/academic/page";
import type { Metadata } from "next";
import { fetchAcademicSections, fetchAcademicResources } from "@/lib/strapi-api";

export const metadata: Metadata = {
    title: "Academic",
};

export default async function Page() {
    const [sections, resources] = await Promise.all([
        fetchAcademicSections(),
        fetchAcademicResources(),
    ]);
    return <AcademicPage sections={sections} resources={resources} />;
}
