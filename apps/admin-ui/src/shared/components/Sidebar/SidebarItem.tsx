'use client';

import Link from 'next/link';
import {
  SidebarItemLink,
  SidebarItemContainer,
  SidebarItemIcon,
  SidebarItemTitle,
} from './sidebar.style';
import { useSidebar } from '../../../hooks/useSidebar';

interface SidebarItemProps {
  icon: React.ReactNode;
  title: string;
  href: string;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  icon,
  title,
  href,
  isActive,
  onClick,
}) => {
  const { setActive } = useSidebar();

  const handleClick = () => {
    setActive(href);
    onClick?.();
  };

  return (
    <SidebarItemLink href={href} $isActive={isActive} onClick={handleClick}>
      <SidebarItemContainer $isActive={isActive}>
        <SidebarItemIcon $isActive={isActive}>{icon}</SidebarItemIcon>
        <SidebarItemTitle $isActive={isActive}>{title}</SidebarItemTitle>
      </SidebarItemContainer>
    </SidebarItemLink>
  );
};

export default SidebarItem;
