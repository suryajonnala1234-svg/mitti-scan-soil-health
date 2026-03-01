'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Package, IndianRupee, TrendingUp, ShoppingCart, ExternalLink } from 'lucide-react';

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

  const getProductData = (name: string) => {
    switch (name) {
      case 'Neem Coated Urea':
        return {
          image: '/images/urea.png',
          priceRange: '₹266 - ₹300 / 45kg bag',
          link: 'https://dir.indiamart.com/search.mp?ss=neem+coated+urea',
        };
      case 'Single Super Phosphate (SSP)':
        return {
          image: '/images/ssp.png',
          priceRange: '₹350 - ₹450 / 50kg bag',
          link: 'https://dir.indiamart.com/search.mp?ss=single+super+phosphate',
        };
      case 'Agricultural Lime':
        return {
          image: '/images/lime.png',
          priceRange: '₹120 - ₹200 / 50kg bag',
          link: 'https://dir.indiamart.com/search.mp?ss=agricultural+lime',
        };
      case 'Muriate of Potash (MOP)':
        return {
          image: '/images/mop.png',
          priceRange: '₹1700 - ₹1800 / 50kg bag',
          link: 'https://dir.indiamart.com/search.mp?ss=muriate+of+potash',
        };
      case 'Vermicompost':
        return {
          image: '/images/vermicompost.png',
          priceRange: '₹300 - ₹600 / 50kg bag',
          link: 'https://dir.indiamart.com/search.mp?ss=vermicompost',
        };
      default:
        return {
          image: '/images/vermicompost.png',
          priceRange: 'Check local vendor for pricing',
          link: 'https://dir.indiamart.com/search.mp?ss=agriculture+fertilizer',
        };
    }
  };

  const productData = getProductData(fertilizer);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -5 }}
      transition={{ duration: 0.3 }}
      className="agriculture-card relative overflow-hidden flex flex-col h-full rounded-2xl bg-white border border-gray-100 shadow-md hover:shadow-xl p-0"
    >
      {/* Priority badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`bg-gradient-to-r ${getPriorityColor()} text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg`}>
          <TrendingUp className="w-3 h-3" />
          Priority {priority}
        </div>
      </div>

      {/* Fertilizer Image */}
      <div className="w-full h-48 relative bg-gray-100 overflow-hidden">
        {/* Using img tag to avoid next.config.js image domain issues during demo */}
        <img
          src={productData.image}
          alt={fertilizer}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-xl font-bold text-white leading-tight drop-shadow-md">{fertilizer}</h3>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col">
        {/* Required details */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex flex-col p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-1.5 mb-1 text-green-700">
              <Package className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Required</span>
            </div>
            <span className="text-sm font-bold text-green-800">
              {quantity} {unit}
            </span>
          </div>

          <div className="flex flex-col p-3 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-1.5 mb-1 text-orange-700">
              <IndianRupee className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Est. Cost</span>
            </div>
            <span className="text-sm font-bold text-orange-800">
              ₹{cost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Pricing Range */}
        <div className="mb-5 bg-blue-50/70 p-3 rounded-xl border border-blue-100">
          <span className="text-xs text-blue-700 font-semibold block mb-0.5 uppercase">Est. Market Price</span>
          <span className="text-sm text-gray-800 font-medium">{productData.priceRange}</span>
        </div>

        {/* Buy Now Button */}
        <div className="mt-auto">
          <a
            href={productData.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <ShoppingCart className="w-5 h-5" />
            Buy Now
            <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
