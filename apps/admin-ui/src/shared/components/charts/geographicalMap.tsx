'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const GeographicalMap = () => {
  const series = [
    {
      name: 'Users',
      data: [400, 430, 448, 470, 540, 580, 690, 1100, 1200, 1380],
    },
    {
      name: 'Sellers',
      data: [30, 40, 45, 50, 49, 60, 70, 91, 125, 140],
    },
  ];

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: false,
      },
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: '70%',
        borderRadius: 4,
      },
    },
    colors: ['#3b82f6', '#10b981'],
    dataLabels: {
      enabled: false,
    },
    xaxis: {
      categories: [
        'Egypt',
        'USA',
        'UK',
        'UAE',
        'Saudi Arabia',
        'Germany',
        'France',
        'Italy',
        'Japan',
        'Canada',
      ],
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    grid: {
      borderColor: '#f1f1f1',
      xaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      fontSize: '14px',
      fontWeight: 500,
    },
    tooltip: {
      y: {
        formatter: (val) => `${val}`,
      },
    },
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Geographical Distribution
          </h2>
          <p className="text-sm text-gray-500">
            Users & Sellers by top countries
          </p>
        </div>
      </div>
      <div className="h-[350px]">
        <Chart options={options} series={series} type="bar" height={350} />
      </div>
    </div>
  );
};

export default GeographicalMap;
