import React from 'react';
import { assets, dummyTestimonial } from '../../assets/assets';

const TestimonialsSection = () => {

  return (
    <section className="section-container py-20">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <span className="badge-primary mb-3 inline-flex">Testimonials</span>
        <h2 className="text-3xl md:text-4xl font-extrabold text-surface-900 tracking-tight">
          What our learners say
        </h2>
        <p className="text-surface-500 mt-4 text-base leading-relaxed">
          Hear from our learners as they share their journeys of transformation and how our platform made a difference.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {dummyTestimonial.map((testimonial, index) => (
          <div
            key={index}
            className="premium-card p-6 flex flex-col gap-4 hover-lift text-left animate-fade-in-up"
            style={{animationDelay: `${index * 0.1}s`}}
          >
            {/* Stars */}
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 ${i < Math.floor(testimonial.rating) ? 'text-amber-400' : 'text-surface-200'}`} viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                </svg>
              ))}
            </div>

            {/* Feedback */}
            <p className="text-surface-600 text-sm leading-relaxed flex-1">
              "{testimonial.feedback}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-2 border-t border-surface-100">
              <img className="h-10 w-10 rounded-full object-cover ring-2 ring-surface-100" src={testimonial.image} alt={testimonial.name} />
              <div>
                <h4 className="text-sm font-semibold text-surface-900">{testimonial.name}</h4>
                <p className="text-xs text-surface-500">{testimonial.role}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TestimonialsSection;
