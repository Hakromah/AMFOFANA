import ContactPage from "@/app/pages-sections/contact/page";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact",
};

export default function Page() {
    return <ContactPage />;
}
