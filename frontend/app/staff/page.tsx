import React from "react";
import StaffPage from "@/app/pages-sections/staff/StaffPage";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Staff",
};

export default function Page() {
    return <StaffPage />;
}
