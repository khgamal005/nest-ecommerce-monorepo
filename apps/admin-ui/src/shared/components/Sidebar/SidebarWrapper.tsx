'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Box from '../Box';
import Link from 'next/link';
import SidebarHeader from './SidebarHeader';
import SidebarBody from './SidebarBody';
import SidebarItem from './SidebarItem';
import SidebarMenu from './SidebarMenu';
import {
  Home,
  Users,
  ShoppingBag,
  Package,
  Settings,
  LogOut,
  Shield,
  FileText,
  CreditCard,
  ExternalLink,
  Trash2,
  Database,
  Tags,
  LayoutGrid,
} from 'lucide-react';
import { useSidebar } from '../../../hooks/useSidebar';
import useAdmin from '../../../hooks/useAdmin';

const SidebarWrapper = () => {
  const { activeItem, setActive, closeSidebar, isMobile } = useSidebar();
  const pathname = usePathname();
  const { admin, sessionPending, logout, isLoggingOut } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    setActive(pathname);
  }, [pathname, setActive]);

  const getIconColor = (route: string) => {
    return route === activeItem ? '#ffffff' : '#94a3b8';
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Box
      css={{
        width: '100%',
        padding: '8px',
        minHeight: '100vh',
        position: 'relative',
        background: 'transparent',
        overflowY: 'auto',
        scrollbarWidth: 'none',
      }}
      className="sidebar-wrapper"
    >
      <SidebarHeader>
        <Box>
          <Link
            href="/dashboard"
            className="flex flex-col justify-center items-center gap-2 p-3 rounded-xl bg-linear-to-r from-purple-800 to-purple-900 shadow-lg"
          >
            <Shield className="w-8 h-8 text-white" />
            <Box className="text-center">
              <h3 className="text-lg font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px]">
                Admin Panel
              </h3>
              <h5 className="text-xs text-purple-200 whitespace-nowrap overflow-hidden text-ellipsis max-w-[160px] mt-1">
                {sessionPending ? (
                  <span className="inline-block w-24 h-3 rounded bg-purple-400/40 animate-pulse" />
                ) : (
                  admin?.email || 'Admin'
                )}
              </h5>
            </Box>
          </Link>
        </Box>
      </SidebarHeader>
      <div className="block h-full my-6">
        <SidebarBody>
          <SidebarItem
            title="Dashboard"
            icon={<Home size={20} color={getIconColor('/dashboard')} />}
            isActive={activeItem === '/dashboard'}
            href="/dashboard"
            onClick={isMobile ? closeSidebar : undefined}
          />
          <div className="mt-4 block space-y-1">
            <SidebarMenu title="Management">
              <SidebarItem
                title="Users"
                icon={
                  <Users size={20} color={getIconColor('/dashboard/users')} />
                }
                isActive={activeItem === '/dashboard/users'}
                href="/dashboard/users"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Admins"
                icon={
                  <Shield
                    size={20}
                    color={getIconColor('/dashboard/management')}
                  />
                }
                isActive={activeItem === '/dashboard/management'}
                href="/dashboard/management"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Orders"
                icon={
                  <ShoppingBag
                    size={20}
                    color={getIconColor('/dashboard/orders')}
                  />
                }
                isActive={activeItem === '/dashboard/orders'}
                href="/dashboard/orders"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Create Product"
                icon={
                  <Package
                    size={20}
                    color={getIconColor('/dashboard/create-product')}
                  />
                }
                isActive={activeItem === '/dashboard/create-product'}
                href="/dashboard/create-product"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="All Products"
                icon={
                  <LayoutGrid
                    size={20}
                    color={getIconColor('/dashboard/all-products')}
                  />
                }
                isActive={activeItem === '/dashboard/all-products'}
                href="/dashboard/all-products"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Deleted Products"
                icon={
                  <Trash2
                    size={20}
                    color={getIconColor('/dashboard/deleted-products')}
                  />
                }
                isActive={activeItem === '/dashboard/deleted-products'}
                href="/dashboard/deleted-products"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Admin Brands"
                icon={
                  <Tags
                    size={20}
                    color={getIconColor('/dashboard/admin-brand')}
                  />
                }
                isActive={activeItem === '/dashboard/admin-brand'}
                href="/dashboard/admin-brand"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Category Manager"
                icon={
                  <Package
                    size={20}
                    color={getIconColor('/dashboard/categoryManager')}
                  />
                }
                isActive={activeItem === '/dashboard/categoryManager'}
                href="/dashboard/categoryManager"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="events"
                icon={
                  <Package
                    size={20}
                    color={getIconColor('/dashboard/events')}
                  />
                }
                isActive={activeItem === '/dashboard/events'}
                href="/dashboard/events"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Payments"
                icon={
                  <CreditCard
                    size={20}
                    color={getIconColor('/dashboard/payments')}
                  />
                }
                isActive={activeItem === '/dashboard/payments'}
                href="/dashboard/payments"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Refunds"
                icon={
                  <FileText
                    size={20}
                    color={getIconColor('/dashboard/refunds')}
                  />
                }
                isActive={activeItem === '/dashboard/refunds'}
                href="/dashboard/refunds"
                onClick={isMobile ? closeSidebar : undefined}
              />
            </SidebarMenu>
            <SidebarMenu title="Analytics">
              <SidebarItem
                title="Notifications"
                icon={
                  <FileText
                    size={20}
                    color={getIconColor('/dashboard/notifications')}
                  />
                }
                isActive={activeItem === '/dashboard/notifications'}
                href="/dashboard/notifications"
                onClick={isMobile ? closeSidebar : undefined}
              />
            </SidebarMenu>
            <SidebarMenu title="Settings">
              <SidebarItem
                title="Customizations"
                icon={
                  <Settings
                    size={20}
                    color={getIconColor('/dashboard/settings')}
                  />
                }
                isActive={activeItem === '/dashboard/settings'}
                href="/dashboard/settings"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <SidebarItem
                title="Storage Cleanup"
                icon={
                  <Database
                    size={20}
                    color={getIconColor('/dashboard/storage-cleanup')}
                  />
                }
                isActive={activeItem === '/dashboard/storage-cleanup'}
                href="/dashboard/storage-cleanup"
                onClick={isMobile ? closeSidebar : undefined}
              />
              <Link
                href="/"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-green-400 hover:bg-green-500/10 transition-colors"
              >
                <ExternalLink size={20} />
                <span className="text-sm font-medium">Go to Store</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                <LogOut size={20} />
                <span className="text-sm font-medium">
                  {isLoggingOut ? 'Logging out...' : 'Logout'}
                </span>
              </button>
            </SidebarMenu>
          </div>
        </SidebarBody>
      </div>
    </Box>
  );
};

export default SidebarWrapper;
