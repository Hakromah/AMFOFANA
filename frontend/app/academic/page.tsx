import AcademicPage from "@/app/pages-sections/academic/page";
import { fetchAcademicResources, fetchAcademicSections, fetchSchoolCalendars } from "@/lib/strapi-api";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Academic",
};

export default async function Page() {
    const [sections, resources, calendars] = await Promise.all([
        fetchAcademicSections(),
        fetchAcademicResources(),
        fetchSchoolCalendars(),
    ]);
    return <AcademicPage sections={sections} resources={resources} calendars={calendars} />;
}
