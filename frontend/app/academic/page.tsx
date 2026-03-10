import React from "react";
import AcademicPage from "@/app/pages-sections/academic/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Academic",
};

export default function Page() {
    return <AcademicPage />;
}