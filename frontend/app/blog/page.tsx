import React from "react";
import BlogPage from "@/app/pages-sections/blog/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Blog",
};

export default function Page() {
    return <BlogPage />;
}
