'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SalesChart = () => {
  const series = [
    {
      name: 'Sales',
      data: [31, 40, 28, 51, 42, 109, 100],
    },
    {
      name: 'Revenue',
      data: [11, 32, 45, 32, 34, 52, 41],
    },
  ];

  const options: ApexOptions = {
    chart: {
      height: 350,
      type: 'area',
      toolbar: {
        show: false,
      },
      fontFamily: 'Inter, sans-serif',
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      type: 'datetime',
      categories: [
        '2024-01-01T00:00:00.000Z',
        '2024-01-02T00:00:00.000Z',
        '2024-01-03T00:00:00.000Z',
        '2024-01-04T00:00:00.000Z',
        '2024-01-05T00:00:00.000Z',
        '2024-01-06T00:00:00.000Z',
        '2024-01-07T00:00:00.000Z',
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    yaxis: {
      labels: {
        formatter: (val) => `$${val}`,
      },
    },
    tooltip: {
      x: {
        format: 'dd MMM yyyy',
      },
    },
    colors: ['#3b82f6', '#10b981'],
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [20, 100, 100, 100],
      },
    },
    grid: {
      borderColor: '#f1f1f1',
      strokeDashArray: 4,
    },
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Sales Analytics</h2>
          <p className="text-sm text-gray-500">Revenue and sales performance</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-gray-600">Sales</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
            <span className="text-sm font-medium text-gray-600">Revenue</span>
          </div>
        </div>
      </div>
      <div className="h-[350px] w-full">
        <Chart options={options} series={series} type="area" height={350} />
      </div>
    </div>
  );
};

export default SalesChart;
