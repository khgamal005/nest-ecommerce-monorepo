'use client';

import React from 'react';
import { SidebarMenuContainer, SidebarMenuTitle } from './sidebar.style';

type SidebarMenuProps = {
  title: string;
  children: React.ReactNode;
};

const SidebarMenu: React.FC<SidebarMenuProps> = ({ title, children }) => {
  return (
    <SidebarMenuContainer>
      <SidebarMenuTitle>{title}</SidebarMenuTitle>
      {children}
    </SidebarMenuContainer>
  );
};

export default SidebarMenu;
