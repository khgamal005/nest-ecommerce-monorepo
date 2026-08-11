import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface ViewMoreButtonProps {
  href: string;
  label?: string;
  className?: string;
}

export default function ViewMoreButton({ href, label = 'شوف أكتر', className = '' }: ViewMoreButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 ${className}`}
    >
      {label}
      <ChevronLeft size={16} />
    </Link>
  );
}
