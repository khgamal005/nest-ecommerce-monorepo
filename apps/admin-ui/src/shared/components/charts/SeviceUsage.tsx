'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const SeviceUsage = () => {
  const series = [45, 30, 25]; // Mobile, Tablet, Computer

  const options: ApexOptions = {
    chart: {
      type: 'donut',
      fontFamily: 'Inter, sans-serif',
    },
    labels: ['Mobile', 'Tablet', 'Computer'],
    colors: ['#3b82f6', '#8b5cf6', '#f43f5e'],
    legend: {
      position: 'bottom',
      fontSize: '14px',
      fontWeight: 500,
      labels: {
        colors: '#64748b',
      },
      markers: {
        size: 8,
        shape: 'circle',
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '75%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              color: '#64748b',
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: '#1e293b',
              formatter: (val) => `${val}%`,
            },
            total: {
              show: true,
              label: 'Total',
              fontSize: '14px',
              fontWeight: 600,
              color: '#64748b',
              formatter: () => '100%',
            },
          },
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 0,
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: (val) => `${val}%`,
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            width: 300,
          },
          legend: {
            position: 'bottom',
          },
        },
      },
    ],
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Service Usage</h2>
        <p className="text-sm text-gray-500">Distribution by device type</p>
      </div>
      <div className="flex justify-center items-center h-[300px]">
        <Chart
          options={options}
          series={series}
          type="donut"
          width="100%"
          height={300}
        />
      </div>
    </div>
  );
};

export default SeviceUsage;
