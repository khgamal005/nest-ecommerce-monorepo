import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadCrumpsProps {
  title: string;
  items?: { label: string; href?: string }[];
}

const BreadCrumps = ({ title, items = [] }: BreadCrumpsProps) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-6">
      <Home className="w-4 h-4" />
      <ChevronRight className="w-4 h-4" />
      
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.href ? (
            <a 
              href={item.href}
              className="hover:text-white transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span>{item.label}</span>
          )}
          {index < items.length - 1 && (
            <ChevronRight className="w-4 h-4" />
          )}
        </React.Fragment>
      ))}
      
      {items.length > 0 && <ChevronRight className="w-4 h-4" />}
      <span className="text-white font-medium">{title}</span>
    </nav>
  );
};

export default BreadCrumps;