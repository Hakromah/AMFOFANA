import React from "react";
import GalleryPage from "@/app/pages-sections/gallery/page";
import Breadcrumb from "@/components/Breadcrumb";
export default function Page() {
    return (
        <div className="overflow-clip">
            <div className="relative -z-1">
            <Breadcrumb
                title="Gallery"
                description="Capturing moments of excellence, creativity, and community across our elementary, junior, and high school campus."
                image="https://images.unsplash.com/photo-1502920917128-1aa500764cbd?q=80&w=2070&auto=format&fit=crop"
                alt="Gallery"
            />
            </div>
            <div className="z-20! relative bg-transparent">
              <GalleryPage />
            </div>
            
        </div>
    );
}
