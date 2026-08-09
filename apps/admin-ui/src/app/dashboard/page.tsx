'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart3,
  Users,
  ShoppingBag,
  Package,
  DollarSign,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import axiosInstance from '../../utils/axiosInstance';
import useAdmin from '../../hooks/useAdmin';
import SalesChart from '../../shared/components/charts/sales-charts';
import SeviceUsage from '../../shared/components/charts/SeviceUsage';
import GeographicalMap from '../../shared/components/charts/geographicalMap';
import { formatEGP } from '../../utils/formatEGP';

const DashboardPage = () => {
  const { admin } = useAdmin();
  const [dashboardStats, setDashboardStats] = useState({
    totalRevenue: { value: 128430, change: 12.5 },
    totalUsers: { value: 45210, change: 8.2 },
    totalProducts: { value: 2400, change: 5.4 },
    currentOrders: { value: 1250, change: 14.1 },
  });

  useEffect(() => {
    let mounted = true;

    axiosInstance
      .get('/api/admin/dashboard/stats')
      .then((response) => {
        if (!mounted) return;

        const data = response.data || {};

        setDashboardStats((previousStats) => ({
          totalRevenue: {
            value:
              typeof data.totalRevenue?.value === 'number'
                ? data.totalRevenue.value
                : previousStats.totalRevenue.value,
            change:
              typeof data.totalRevenue?.change === 'number'
                ? data.totalRevenue.change
                : previousStats.totalRevenue.change,
          },
          totalUsers: {
            value:
              typeof data.totalUsers?.value === 'number'
                ? data.totalUsers.value
                : previousStats.totalUsers.value,
            change:
              typeof data.totalUsers?.change === 'number'
                ? data.totalUsers.change
                : previousStats.totalUsers.change,
          },
          totalProducts: {
            value:
              typeof data.totalProducts?.value === 'number'
                ? data.totalProducts.value
                : previousStats.totalProducts.value,
            change:
              typeof data.totalProducts?.change === 'number'
                ? data.totalProducts.change
                : previousStats.totalProducts.change,
          },
          currentOrders: {
            value:
              typeof data.currentOrders?.value === 'number'
                ? data.currentOrders.value
                : previousStats.currentOrders.value,
            change:
              typeof data.currentOrders?.change === 'number'
                ? data.currentOrders.change
                : previousStats.currentOrders.change,
          },
        }));
      })
      .catch((error) => {
        console.error('Failed to load dashboard stats:', error);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    {
      label: 'Total Revenue',
      value: formatEGP(dashboardStats.totalRevenue.value),
      icon: DollarSign,
      trend: `${dashboardStats.totalRevenue.change >= 0 ? '+' : ''}${dashboardStats.totalRevenue.change}%`,
      color: 'bg-blue-500',
    },
    {
      label: 'Total Users',
      value: dashboardStats.totalUsers.value.toLocaleString(),
      icon: Users,
      trend: `${dashboardStats.totalUsers.change >= 0 ? '+' : ''}${dashboardStats.totalUsers.change}%`,
      color: 'bg-indigo-500',
    },
    {
      label: 'Total Products',
      value: dashboardStats.totalProducts.value.toLocaleString(),
      icon: ShoppingBag,
      trend: `${dashboardStats.totalProducts.change >= 0 ? '+' : ''}${dashboardStats.totalProducts.change}%`,
      color: 'bg-emerald-500',
    },
    {
      label: 'Current Orders',
      value: dashboardStats.currentOrders.value.toLocaleString(),
      icon: Package,
      trend: `${dashboardStats.currentOrders.change >= 0 ? '+' : ''}${dashboardStats.currentOrders.change}%`,
      color: 'bg-rose-500',
    },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-gray-500 mt-1 font-medium">
            Welcome back,{' '}
            <span className="text-blue-600">
              {admin?.email || 'Administrator'}
            </span>
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 font-semibold">
          <TrendingUp className="w-4 h-4" />
          <span>Live Updates</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow group"
          >
            <div className="flex justify-between items-start mb-4">
              <div
                className={`p-3 rounded-xl ${stat.color} text-white shadow-lg`}
              >
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full text-xs font-bold">
                <ArrowUpRight className="w-3 h-3" />
                {stat.trend}
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">
                {stat.value}
              </h3>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <SalesChart />
        </div>
        <div>
          <SeviceUsage />
        </div>
      </div>

      {/* Geographical Map Section */}
      <div className="w-full">
        <GeographicalMap />
      </div>
    </div>
  );
};

export default DashboardPage;
