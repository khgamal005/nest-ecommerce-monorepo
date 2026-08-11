'use client';

import React, { useState, useEffect } from 'react';
import useLayout from '../../hooks/useLayout';
import { SafeImage } from '@/components/media';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface RichBanner {
  fileId: string;
  file_Url: string;
  title: string;
  subtitle: string;
  buttonText: string;
  buttonLink: string;
  textPosition: 'left' | 'center' | 'right';
  textColor: string;
  overlayOpacity: number;
  order: number;
  isActive: boolean;
  objectFit?: 'cover' | 'contain';
}

export default function Hero() {
  const { banners, isLoading } = useLayout();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const autoPlayTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Filter active banners and sort by order
  const activeBanners: RichBanner[] = (banners || [])
    .filter((b: RichBanner) => b.isActive)
    .sort((a: RichBanner, b: RichBanner) => a.order - b.order);

  // Auto-play carousel
  useEffect(() => {
    if (!autoPlay || activeBanners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    }, 4000); // Change slide every 4 seconds (like Noon)

    return () => clearInterval(interval);
  }, [autoPlay, activeBanners.length]);

  // Auto-resume auto-play after user interaction
  const handleUserInteraction = () => {
    setAutoPlay(false);

    // Clear any existing timeout
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current);
    }

    // Resume auto-play after 10 seconds of inactivity
    autoPlayTimeoutRef.current = setTimeout(() => {
      setAutoPlay(true);
    }, 10000);
  };

  useEffect(() => {
    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current);
      }
    };
  }, []);

  if (isLoading || !activeBanners || activeBanners.length === 0) {
    return (
      <section className="relative w-full h-96 md:h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="w-96 h-96 bg-gray-300 rounded-lg"></div>
        </div>
      </section>
    );
  }

  const banner = activeBanners[currentSlide];
  const textAlignment =
    banner.textPosition === 'left'
      ? 'items-start'
      : banner.textPosition === 'right'
      ? 'items-end'
      : 'items-center';

  const handlePrevious = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? activeBanners.length - 1 : prev - 1
    );
    handleUserInteraction();
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % activeBanners.length);
    handleUserInteraction();
  };

  return (
    <section
      className="relative w-full overflow-hidden aspect-[16/9] md:aspect-[21/9] max-h-[700px]"
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
    >
      {/* Banner Image */}
      <SafeImage
        src={banner.file_Url}
        alt={banner.title}
        fill
        sizes="100vw"
        className={banner.objectFit === 'contain' ? 'object-contain' : 'object-cover'}
        priority
      />

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${banner.overlayOpacity})`,
        }}
      />

      {/* Content */}
      <div
        className={`absolute inset-0 flex flex-col ${textAlignment} justify-center px-6 md:px-12 py-8`}
      >
        <div
          className="max-w-2xl"
          style={{
            textAlign: banner.textPosition as any,
          }}
        >
          {/* Title */}
          <h1
            className="text-4xl md:text-6xl font-bold mb-4 leading-tight"
            style={{ color: banner.textColor }}
          >
            {banner.title}
          </h1>

          {/* Subtitle */}
          {banner.subtitle && (
            <p
              className="text-lg md:text-2xl mb-8 font-medium"
              style={{ color: banner.textColor }}
            >
              {banner.subtitle}
            </p>
          )}

          {/* CTA Button */}
          {banner.buttonText && banner.buttonLink && (
            <a
              href={banner.buttonLink}
              target={banner.buttonLink.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              className="inline-block px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105"
            >
              {banner.buttonText}
            </a>
          )}
        </div>
      </div>

      {/* Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={handlePrevious}
            className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all duration-300 group"
            aria-label="الشريحة السابقة"
          >
            <ChevronLeft className="w-6 h-6 group-hover:scale-125 transition-transform" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition-all duration-300 group"
            aria-label="الشريحة التالية"
          >
            <ChevronRight className="w-6 h-6 group-hover:scale-125 transition-transform" />
          </button>
        </>
      )}

      {/* Progress Bar (Auto-play indicator) */}
      {autoPlay && activeBanners.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{
              width: `${((currentSlide + 1) / activeBanners.length) * 100}%`,
            }}
          />
        </div>
      )}

      {/* Dot Indicators */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentSlide(index);
                handleUserInteraction();
              }}
              className={`transition-all duration-300 ${
                index === currentSlide
                  ? 'bg-white w-8 h-3 rounded-full'
                  : 'bg-white/50 hover:bg-white/75 w-3 h-3 rounded-full'
              }`}
              aria-label={`الذهاب إلى الشريحة ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Slide Counter */}
      {activeBanners.length > 1 && (
        <div className="absolute top-6 right-6 z-20 bg-black/40 text-white px-4 py-2 rounded-full text-sm font-semibold">
          {currentSlide + 1} / {activeBanners.length}
        </div>
      )}
    </section>
  );
}
