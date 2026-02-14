'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface NutrientGaugeProps {
  nutrient: string;
  value: number;
  maxValue: number;
  status: 'Low' | 'Critical' | 'Optimal';
}

export default function NutrientGauge({ nutrient, value, maxValue, status }: NutrientGaugeProps) {
  const percentage = Math.min((value / maxValue) * 100, 100);
  
  const getColor = () => {
    if (status === 'Critical') return { color: '#ef4444', bg: '#fee2e2' };
    if (status === 'Low') return { color: '#f59e0b', bg: '#fef3c7' };
    return { color: '#10b981', bg: '#d1fae5' };
  };

  const colors = getColor();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      className="agriculture-card p-6 relative overflow-hidden"
    >
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10"
        style={{ background: colors.color, transform: 'translate(30%, -30%)' }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">{nutrient}</h3>
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{ 
              background: colors.bg,
              color: colors.color
            }}
          >
            {status}
          </span>
        </div>

        {/* Circular gauge */}
        <div className="flex items-center justify-center my-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={colors.bg}
                strokeWidth="12"
              />
              {/* Progress circle */}
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke={colors.color}
                strokeWidth="12"
                strokeDasharray={`${2 * Math.PI * 56}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                animate={{ 
                  strokeDashoffset: 2 * Math.PI * 56 * (1 - percentage / 100) 
                }}
                transition={{ duration: 1, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: colors.color }}>
                {Math.round(percentage)}%
              </span>
              <span className="text-xs text-gray-500">of ideal</span>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">Current: {value}</p>
          <p className="text-xs text-gray-500">Target: {maxValue}</p>
        </div>
      </div>
    </motion.div>
  );
}
