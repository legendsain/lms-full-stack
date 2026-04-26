import React from 'react';
import { assets } from '../../assets/assets';

const Companies = () => {
  const logos = [
    { src: assets.microsoft_logo, alt: 'Microsoft' },
    { src: assets.walmart_logo, alt: 'Walmart' },
    { src: assets.accenture_logo, alt: 'Accenture' },
    { src: assets.adobe_logo, alt: 'Adobe' },
    { src: assets.paypal_logo, alt: 'Paypal' },
  ];

  return (
    <section className="py-12 w-full">
      <p className="text-sm font-medium text-surface-400 text-center uppercase tracking-wider mb-8">
        Trusted by learners from
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-60 hover:opacity-80 transition-opacity duration-500">
        {logos.map((logo, i) => (
          <img 
            key={i}
            className='h-6 md:h-8 object-contain grayscale hover:grayscale-0 transition-all duration-300' 
            src={logo.src} 
            alt={logo.alt} 
          />
        ))}
      </div>
    </section>
  );
};

export default Companies;
