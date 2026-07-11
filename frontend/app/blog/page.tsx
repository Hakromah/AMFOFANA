import BlogPage from "@/app/pages-sections/blog/page";
import { fetchBlogPosts } from "@/lib/strapi-api";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Blog",
};

export default async function Page() {
    const { posts } = await fetchBlogPosts({ pageSize: 100 });
    return <BlogPage initialPosts={posts} />;
}
