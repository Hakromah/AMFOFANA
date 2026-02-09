import React from 'react';
import Image from 'next/image';

interface BreadcrumbProps {
    title: string;
    description?: string;
    image: string;
    alt?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ title, description, image, alt = "Breadcrumb background" }) => {
    return (
        <section className="relative h-[60vh] flex items-center justify-center">
            <div className="absolute inset-0">
                <Image
                    src={image}
                    alt={alt}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-black/60" />
            </div>
            <div className="relative z-10 container mx-auto px-4 text-center text-white">
                <h1 className="text-4xl md:text-6xl font-bold mb-4 font-sans">{title}</h1>
                {description && (
                    <p className="text-xl md:text-2xl max-w-2xl mx-auto font-light">
                        {description}
                    </p>
                )}
            </div>
        </section>
    );
};

export default Breadcrumb;
