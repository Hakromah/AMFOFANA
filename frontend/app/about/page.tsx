import React from "react";
import AboutPage from "@/app/pages-sections/about/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us",
};

export default function Page() {
    return <AboutPage />;
}
