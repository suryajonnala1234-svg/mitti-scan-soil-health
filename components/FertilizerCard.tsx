'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, IndianRupee, TrendingUp } from 'lucide-react';

interface FertilizerCardProps {
  fertilizer: string;
  quantity: number;
  unit: string;
  cost: number;
  priority: number;
}

export default function FertilizerCard({ 
  fertilizer, 
  quantity, 
  unit, 
  cost, 
  priority 
}: FertilizerCardProps) {
  const getPriorityColor = () => {
    if (priority === 1) return 'from-red-500 to-red-600';
    if (priority === 2) return 'from-orange-500 to-orange-600';
    return 'from-yellow-500 to-yellow-600';
  };

  const getFertilizerImage = () => {
    // Placeholder images - in production, use actual fertilizer images
    const images: Record<string, string> = {
      'Neem Coated Urea': '🌱',
      'Single Super Phosphate (SSP)': '⚗️',
      'Muriate of Potash (MOP)': '💎',
      'Vermicompost': '🪱',
      'Agricultural Lime': '⛰️',
    };
    return images[fertilizer] || '🌾';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -5 }}
      transition={{ duration: 0.3 }}
      className="agriculture-card p-6 relative overflow-hidden"
    >
      {/* Priority badge */}
      <div className="absolute top-4 right-4">
        <div className={`bg-gradient-to-r ${getPriorityColor()} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg`}>
          <TrendingUp className="w-3 h-3" />
          Priority {priority}
        </div>
      </div>

      {/* Fertilizer icon/image */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center text-4xl transform hover:rotate-12 transition-transform">
          {getFertilizerImage()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 mb-1">{fertilizer}</h3>
          <p className="text-sm text-gray-600">Essential for soil health</p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-700 font-medium">Quantity</span>
          </div>
          <span className="text-lg font-bold text-green-700">
            {quantity} {unit}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
          <div className="flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-gray-700 font-medium">Total Cost</span>
          </div>
          <span className="text-lg font-bold text-orange-700">
            ₹{cost.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-green-100 to-transparent rounded-tl-full opacity-30" />
    </motion.div>
  );
}
