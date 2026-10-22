'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

const PromotionSection = () => {

  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://elfsightcdn.com/platform.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      try {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      } catch (e) {
        console.error("Error removing script", e);
      }
    };
  }, []);

  return (
    <section className="relative py-20 lg:py-20 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/images/promotion-background-img.svg)',
        }}
      />

      <div className="absolute bottom-0 left-0 w-48 lg:w-64">
        <Image
          src="/images/Travel_Concepts_left-botom.svg"
          alt="Travel decoration"
          width={250}
          height={200}
          className="w-full h-auto"
        />
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center mb-12">
          <span className="text-[#F85E46] font-semibold text-sm tracking-wider uppercase mb-3 block">
            Promotion
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-4xl font-bold text-gray-800 leading-tight font-serif italic">
            See What Our Clients Say<br />
            About Us
          </h2>
        </div>

        <div className="flex justify-center w-full">
          {/* We added minHeight: '400px' so the container doesn't collapse to 0 */}
          <div style={{ width: '110%', overflow: 'hidden', minHeight: '350px' }}>
            <div 
              className="elfsight-app-997bbe15-c2b0-4238-a2d9-893cb3d16542" 
              data-elfsight-app-lazy 
              style={{ marginBottom: '-190px' }} 
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromotionSection;
