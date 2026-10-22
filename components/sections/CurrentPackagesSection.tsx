import React from 'react';
import Image from 'next/image';

const CurrentPackagesSection: React.FC = () => {
  const features = [
    {
      icon: '🌍',
      title: 'Handpicked Experiences by Local Experts',
      description: 'Enjoy carefully selected desert adventures and activities recommended by experienced local guides.',
    },
    {
      icon: '📍',
      title: 'City Highlights, Adventures & Hidden Gems',
      description: 'Discover famous landmarks, thrilling desert activities, and unique experiences beyond the usual tourist spots.',
    },
    {
      icon: '🤝',
      title: 'Personalized Service Across the UAE',
      description: 'Receive dedicated support to ensure a smooth, comfortable, and memorable desert travel experience. ',
    },
  ];

  return (
    <section className="py-4 lg:py-6 bg-white">
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* Left - Image */}
          <div className="lg:w-1/2">
            <div className="rounded-2xl overflow-hidden  h-full w-full relative">
            {/*  <Image
                src="https://dubaijourneytourism.com/wp-content/uploads/2026/02/4ffd1457-83b8-4b45-bd2e-a50e05395ee0-1.webp"
                alt="Dubai Frame"
                fill
                className="object-contain"
              /> */}
            <Image
  src="https://dubaijourneytourism.com/wp-content/uploads/2026/02/4ffd1457-83b8-4b45-bd2e-a50e05395ee0-1.webp"
  alt="Dubai Frame"
  width={700}      // adjust width as needed
  height={500}     // adjust height as needed
  className="rounded-[10px] border-[3px] border-[#E5E7EB] object-contain"
  unoptimized
/>
            </div>
          </div>

          {/* Right - Content Card */}
          <div className="lg:w-1/2">
            <div 
              className="h-full rounded-2xl py-5 px-5 lg:p-6"
              style={{ backgroundColor: '#EDEDED' }}
            >
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                Custom Tour Packages
              </h2>
              <p className="text-gray-500 text-xs md:text-sm mb-4 leading-relaxed">
                Create your perfect desert tour package with flexible options, exclusive deals, and experiences tailored to your travel style.

              </p>

              <div className="space-y-2">
                {features.map((feature, index) => (
                  <div key={index}>
                    <div className="text-[20px] mb-1">{feature.icon}</div>
                    <h3 className="font-bold text-gray-800 text-base md:text-lg leading-snug mb-0.5">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CurrentPackagesSection;
