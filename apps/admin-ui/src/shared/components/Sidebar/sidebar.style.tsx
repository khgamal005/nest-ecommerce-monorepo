'use client';

import styled from 'styled-components';
import Link from 'next/link';

// SidebarWrapper Styles
export const SideWrapper = styled.div`
  width: 280px;
  height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
  padding: 1.5rem 1rem;
  position: fixed;
  left: 0;
  top: 0;
  overflow-y: auto;
  border-right: 1px solid #334155;
  box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  z-index: 50;

  /* Mobile responsiveness */
  @media (max-width: 767px) {
    z-index: 100;
  }

  /* Scrollbar Styling */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1e293b;
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #475569 0%, #64748b 100%);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #64748b 0%, #94a3b8 100%);
  }
`;

// SidebarMenu Styles
export const SidebarMenuContainer = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

export const SidebarMenuTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  color: #64748b;
  margin-bottom: 1rem;
  padding-left: 0.5rem;
  border-left: 2px solid #475569;
`;

// SidebarItem Styles
export const SidebarItemLink = styled(Link)<{ $isActive: boolean }>`
  display: block;
  margin: 0.4rem 0;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 0.75rem;

  &:hover {
    transform: translateX(0.5rem);
    background: rgba(255, 255, 255, 0.05);
  }
`;

export const SidebarItemContainer = styled.div<{ $isActive: boolean }>`
  display: flex;
  gap: 0.75rem;
  width: 100%;
  min-height: 3rem;
  align-items: center;
  padding: 0 1rem;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  /* Base styles */
  background: ${(props) =>
    props.$isActive
      ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
      : 'transparent'};
  transform: ${(props) =>
    props.$isActive ? 'scale(1.02) translateX(0.5rem)' : 'scale(1)'};
  box-shadow: ${(props) =>
    props.$isActive ? '0 4px 12px rgba(139, 92, 246, 0.3)' : 'none'};

  /* Hover styles */
  &:hover {
    background: ${(props) =>
      props.$isActive
        ? 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'
        : 'rgba(255, 255, 255, 0.08)'};
  }

  /* Active state indicator */
  &::before {
    content: '';
    position: absolute;
    left: -1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: ${(props) => (props.$isActive ? '24px' : '0')};
    background: #8b5cf6;
    border-radius: 2px;
    transition: all 0.3s ease;
  }
`;

export const SidebarItemIcon = styled.span<{ $isActive: boolean }>`
  font-size: 1.25rem;
  color: ${(props) => (props.$isActive ? '#ffffff' : '#94a3b8')};
  width: 1.5rem;
  display: flex;
  justify-content: center;
  transition: all 0.3s ease;
  filter: ${(props) =>
    props.$isActive ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))' : 'none'};
`;

export const SidebarItemTitle = styled.h5<{ $isActive: boolean }>`
  font-size: 0.95rem;
  font-weight: ${(props) => (props.$isActive ? '600' : '500')};
  color: ${(props) => (props.$isActive ? '#ffffff' : '#cbd5e1')};
  margin: 0;
  flex: 1;
  transition: all 0.3s ease;
  text-transform: capitalize;

  ${SidebarItemContainer}:hover & {
    color: ${(props) => (props.$isActive ? '#ffffff' : '#f1f5f9')};
    font-weight: ${(props) => (props.$isActive ? '600' : '500')};
  }
`;
