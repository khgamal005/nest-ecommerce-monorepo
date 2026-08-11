import React from 'react';
import TitleBorder from '../../assets/svgs/TitleBorder';

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  alignment?: 'left' | 'center' | 'right';
  variant?: 'default' | 'gradient' | 'outlined' | 'gradient-fancy';
  showBorder?: boolean;
  className?: string;
  titleClassName?: string;
  gradientColors?: {
    from: string;
    via?: string;
    to: string;
  };
}

const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  alignment = 'start',
  variant = 'gradient-fancy',
  showBorder = true,
  className = '',
  titleClassName = '',
  gradientColors = {
    from: '#3B82F6', // blue-500
    to: '#8B5CF6', // purple-500
  },
}) => {
  const alignmentClasses = {
    start: 'text-start',
    center: 'text-center',
    end: 'text-end',
    left: 'text-left',
    right: 'text-right',
  };

  const variantClasses = {
    default: 'text-slate-900',
    gradient:
      'text-transparent bg-clip-text bg-gradient-to-r rtl:bg-gradient-to-l from-blue-500 to-purple-500',
    'gradient-fancy':
      'text-transparent bg-clip-text bg-gradient-to-r rtl:bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500',
    outlined: 'text-slate-900',
  };

  const borderPositions = {
    start: 'inset-s-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'inset-e-0',
    left: 'left-0',
    right: 'right-0',
  };

  // Custom gradient style for dynamic colors
  const customGradientStyle =
    variant === 'gradient' && gradientColors
      ? {
          backgroundImage: gradientColors.via
            ? `linear-gradient(to right, ${gradientColors.from}, ${gradientColors.via}, ${gradientColors.to})`
            : `linear-gradient(to right, ${gradientColors.from}, ${gradientColors.to})`,
        }
      : undefined;

  return (
    <div
      className={`relative mb-12 ${
        alignmentClasses[alignment as keyof typeof alignmentClasses] ||
        'text-start'
      } ${className}`}
    >
      {/* Badge/Pre-title */}
      {subtitle && (
        <div className="mb-3 inline-block">
          <span className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-blue-700 bg-gradient-to-r rtl:bg-gradient-to-l from-blue-50 to-purple-50 rounded-full border border-blue-200/50 shadow-sm">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            {subtitle}
          </span>
        </div>
      )}

      {/* Main Title with Gradient */}
      <div className="relative">
        <h1
          className={`text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight relative z-10 leading-tight ${variantClasses[variant]} ${titleClassName}`}
          style={customGradientStyle}
        >
          {title}
        </h1>

        {/* Optional underline effect with same gradient */}
        {variant === 'outlined' && (
          <span
            className="block w-24 h-1.5 bg-gradient-to-r rtl:bg-gradient-to-l from-blue-500 to-purple-500 rounded-full mt-4 mb-6"
            style={{
              backgroundImage: gradientColors.via
                ? `linear-gradient(to var(--direction, right), ${gradientColors.from}, ${gradientColors.via}, ${gradientColors.to})`
                : `linear-gradient(to var(--direction, right), ${gradientColors.from}, ${gradientColors.to})`,
            }}
          ></span>
        )}
      </div>

      {/* Border SVG */}
      {showBorder && (
        <div
          className={`absolute ${
            borderPositions[alignment as keyof typeof borderPositions] ||
            'inset-s-0'
          } w-full max-w-xs mt-6`}
        >
          <TitleBorder
            className={`w-full rtl:scale-x-[-1] ${
              alignment === 'center'
                ? 'mx-auto'
                : alignment === 'end' || alignment === 'right'
                ? 'ms-auto'
                : 'me-auto'
            }`}
          />
        </div>
      )}

      {/* Decorative background elements */}
      <div className="absolute -top-6 -end-6 w-32 h-32 bg-gradient-to-r rtl:bg-gradient-to-l from-blue-100/40 to-purple-100/40 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-6 -start-6 w-24 h-24 bg-gradient-to-r rtl:bg-gradient-to-l from-purple-100/30 to-pink-100/30 rounded-full blur-2xl -z-10"></div>

      {/* Optional description */}
      {alignment === 'center' && variant === 'gradient-fancy' && (
        <p className="mt-6 text-slate-600 max-w-2xl mx-auto text-lg">
          اكتشف مجموعتنا المختارة من المنتجات المتميزة
        </p>
      )}
    </div>
  );
};

export default SectionTitle;
