'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit, Leaf } from 'lucide-react';
import axios from 'axios';

interface SoilValues {
  N: number;
  P: number;
  K: number;
  OC: number;
  pH: number;
}

interface VerifyFormProps {
  initialValues: SoilValues;
  token: string;
  onComplete: (scanId: string) => void;
}

const CROPS = ['Wheat', 'Rice', 'Cotton', 'Maize'];

export default function VerifyForm({ initialValues, token, onComplete }: VerifyFormProps) {
  const [soilValues, setSoilValues] = useState<SoilValues>(initialValues);
  const [crop, setCrop] = useState('Wheat');
  const [farmSize, setFarmSize] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleValueChange = (key: keyof SoilValues, value: string) => {
    setSoilValues(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const response = await axios.post(
        '/api/scan/verify',
        {
          crop,
          farmSize,
          soilValues,
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      onComplete(response.data.data._id);
    } catch (error: any) {
      console.error('Verify error:', error);
      alert(error.response?.data?.error || 'Failed to save scan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="agriculture-card p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center">
          <Edit className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-agriculture">Verify & Edit Values</h2>
          <p className="text-gray-600 text-sm">Review and correct the extracted data</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Soil Values Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-green-600" />
              Nitrogen (N) - kg/ha
            </label>
            <input
              type="number"
              step="0.01"
              value={soilValues.N}
              onChange={(e) => handleValueChange('N', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-orange-600" />
              Phosphorus (P) - kg/ha
            </label>
            <input
              type="number"
              step="0.01"
              value={soilValues.P}
              onChange={(e) => handleValueChange('P', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-yellow-600" />
              Potassium (K) - kg/ha
            </label>
            <input
              type="number"
              step="0.01"
              value={soilValues.K}
              onChange={(e) => handleValueChange('K', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-brown-600" />
              Organic Carbon (OC) - %
            </label>
            <input
              type="number"
              step="0.01"
              value={soilValues.OC}
              onChange={(e) => handleValueChange('OC', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-blue-600" />
              pH Level
            </label>
            <input
              type="number"
              step="0.01"
              value={soilValues.pH}
              onChange={(e) => handleValueChange('pH', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
              required
            />
          </div>
        </div>

        {/* Crop Selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Select Crop</label>
          <select
            value={crop}
            onChange={(e) => setCrop(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
          >
            {CROPS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Farm Size */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700">Farm Size (acres)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            value={farmSize}
            onChange={(e) => setFarmSize(parseFloat(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
            required
          />
        </div>

        {/* Submit Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSaving}
          className="w-full btn-agriculture flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing Soil...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Analyze & Get Recommendations
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
