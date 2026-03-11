import React from "react";
import StaffPage from "@/app/pages-sections/staff/StaffPage";
import type { Metadata } from "next";
import { fetchStaffMembers } from "@/lib/strapi-api";

export const metadata: Metadata = {
    title: "Staff",
};

export default async function Page() {
    const staffMembers = await fetchStaffMembers();
    return <StaffPage staffMembers={staffMembers} />;
}
