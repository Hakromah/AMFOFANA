import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Breadcrumb from '@/components/Breadcrumb';

export default function AboutPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <Breadcrumb
        title="About AMFOFANA"
        description="Dedicated to excellence in education and character development since 1990."
        image="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?q=80&w=2070&auto=format&fit=crop"
        alt="About Us Hero"
      />

      {/* History & Mission Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-primary">Our History</h2>
              <p className="text-muted-foreground leading-relaxed">
                Founded in February 1990, AMFOFANA High School started with a humble vision: to provide quality education that nurtures not just the mind, but the heart and spirit of every student. Over the past three decades, we have grown from a small community school into a leading institution recognized for academic excellence and holistic development.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Our journey has been marked by continuous innovation, infrastructure development, and a steadfast commitment to our core values. Today, our alumni are making waves across the globe, a testament to the strong foundation laid here.
              </p>
            </div>
            <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src="https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?q=80&w=1974&auto=format&fit=crop"
                alt="School History"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Cards */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-background p-8 rounded-2xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-[#2857AE] mb-4">Our Mission</h3>
              <p className="text-muted-foreground">
                To empower students with knowledge, skills, and values that enable them to excel academically and contribute positively to society. We strive to create a learning environment that fosters critical thinking, creativity, and integrity.
              </p>
            </div>
            <div className="bg-background p-8 rounded-2xl shadow-sm border border-border">
              <h3 className="text-2xl font-bold text-[#2857AE] mb-4">Our Vision</h3>
              <p className="text-muted-foreground">
                To be a premier educational institution that cultivates global leaders of tomorrow, known for their academic prowess, ethical leadership, and commitment to social responsibility.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-12">Our Leadership</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((item) => (
              <div key={item} className="group">
                <div className="relative h-[300px] w-full mb-4 overflow-hidden rounded-xl">
                  <Image
                    src={`https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=1974&auto=format&fit=crop&bg=f3f4f6`}
                    alt="Team Member"
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <h4 className="text-xl font-semibold">Leadership Name</h4>
                <p className="text-muted-foreground">Position Title</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-[#2857AE] text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Experience the AMFOFANA difference. Apply today or schedule a visit to see our campus.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="secondary" size="lg" className="font-semibold">
              Apply Now
            </Button>
            <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-[#2857AE]">
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
