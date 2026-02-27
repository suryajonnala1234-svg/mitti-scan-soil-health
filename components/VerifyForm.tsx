'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Edit, Leaf, AlertTriangle, Droplets, Flame, Wind, Sprout, FlaskConical } from 'lucide-react';
import axios from 'axios';

const CROPS = ['Wheat', 'Rice', 'Cotton', 'Maize'];

interface SoilValues {
  N: number;
  P: number;
  K: number;
  OC: number;
  pH: number;
}

interface AllParameterRow {
  srNo: number;
  parameter: string;
  testValue: number;
  unit: string;
  rating: string;
  normalLevel: string;
}

interface VerifyFormProps {
  initialValues: SoilValues;
  allParameters?: Record<string, { value: string; unit?: string; rating?: string }>;
  token: string;
  onComplete: (scanId: string) => void;
  extractedText?: string;
}

// The 5 parameters used for analysis
const PRIMARY_PARAMS = [
  {
    key: 'pH' as const,
    label: 'pH Level',
    unit: '',
    normalLevel: '6.0 – 7.5  (Neutral)',
    icon: Droplets,
    color: 'from-blue-500 to-blue-700',
    accent: 'border-blue-300 bg-blue-50',
    hint: 'Typical range: 4.5 – 9.0',
    step: '0.01',
  },
  {
    key: 'OC' as const,
    label: 'Organic Carbon (OC)',
    unit: '%',
    normalLevel: '0.51 – 0.75%',
    icon: Flame,
    color: 'from-amber-500 to-amber-700',
    accent: 'border-amber-300 bg-amber-50',
    hint: 'Typical range: 0.1 – 2.0%',
    step: '0.01',
  },
  {
    key: 'N' as const,
    label: 'Available Nitrogen (N)',
    unit: 'kg/ha',
    normalLevel: '280 – 560 kg/ha',
    icon: Wind,
    color: 'from-green-500 to-green-700',
    accent: 'border-green-300 bg-green-50',
    hint: 'Typical range: 0 – 600 kg/ha',
    step: '0.1',
  },
  {
    key: 'P' as const,
    label: 'Available Phosphorus (P)',
    unit: 'kg/ha',
    normalLevel: '11 – 26 kg/ha',
    icon: Sprout,
    color: 'from-orange-500 to-orange-700',
    accent: 'border-orange-300 bg-orange-50',
    hint: 'Typical range: 0 – 100 kg/ha',
    step: '0.1',
  },
  {
    key: 'K' as const,
    label: 'Available Potassium (K)',
    unit: 'kg/ha',
    normalLevel: '120 – 280 kg/ha',
    icon: FlaskConical,
    color: 'from-purple-500 to-purple-700',
    accent: 'border-purple-300 bg-purple-50',
    hint: 'Typical range: 0 – 600 kg/ha',
    step: '0.1',
  },
];

// Build the full 12-row array (still saved for result display) but only using the 5 primary values
function buildAllRows(
  initialValues: SoilValues,
  allParameters?: Record<string, { value: string; unit?: string; rating?: string }>
): AllParameterRow[] {
  const DEFAULT_ROWS: AllParameterRow[] = [
    { srNo: 1, parameter: 'pH', testValue: 0, unit: '', rating: '', normalLevel: '7, Neutral' },
    { srNo: 2, parameter: 'EC', testValue: 0, unit: 'dS/m', rating: '', normalLevel: '0 - 2 dS/m' },
    { srNo: 3, parameter: 'Organic Carbon (OC)', testValue: 0, unit: '%', rating: '', normalLevel: '0.51 - 0.75%' },
    { srNo: 4, parameter: 'Available Nitrogen (N)', testValue: 0, unit: 'kg/ha', rating: '', normalLevel: '280 - 560 kg/ha' },
    { srNo: 5, parameter: 'Available Phosphorus (P)', testValue: 0, unit: 'kg/ha', rating: '', normalLevel: '11-26 kg/ha' },
    { srNo: 6, parameter: 'Available Potassium (K)', testValue: 0, unit: 'kg/ha', rating: '', normalLevel: '120-280 kg/ha' },
    { srNo: 7, parameter: 'Available Sulphur (S)', testValue: 0, unit: 'ppm', rating: '', normalLevel: '> 10 ppm' },
    { srNo: 8, parameter: 'Available Zinc (Zn)', testValue: 0, unit: 'ppm', rating: '', normalLevel: '> 0.6 ppm' },
    { srNo: 9, parameter: 'Available Boron (B)', testValue: 0, unit: 'ppm', rating: '', normalLevel: '> 0.5 ppm' },
    { srNo: 10, parameter: 'Available Iron (Fe)', testValue: 0, unit: 'ppm', rating: '', normalLevel: '> 4.5 ppm' },
    { srNo: 11, parameter: 'Available Manganese (Mn)', testValue: 0, unit: 'ppm', rating: '', normalLevel: '> 2.0 ppm' },
    { srNo: 12, parameter: 'Available Copper (Cu)', testValue: 0, unit: 'ppm', rating: '', normalLevel: '> 0.2 ppm' },
  ];

  const rows = DEFAULT_ROWS.map(r => ({ ...r }));

  // Primary values locked from initialValues
  rows[0].testValue = initialValues.pH || 0;
  rows[2].testValue = initialValues.OC || 0;
  rows[3].testValue = initialValues.N || 0;
  rows[4].testValue = initialValues.P || 0;
  rows[5].testValue = initialValues.K || 0;

  if (!allParameters) return rows;

  const mappings = [
    { keys: ['electrical conductivity', ' ec'], rowIdx: 1 },
    { keys: ['sulphur', 'sulfur'], rowIdx: 6 },
    { keys: ['zinc'], rowIdx: 7 },
    { keys: ['boron'], rowIdx: 8 },
    { keys: ['iron'], rowIdx: 9 },
    { keys: ['manganese'], rowIdx: 10 },
    { keys: ['copper'], rowIdx: 11 },
  ];

  Object.entries(allParameters).forEach(([key, param]) => {
    const kLower = key.toLowerCase();
    const row = mappings.find(m => m.keys.some(k => kLower.includes(k)));
    if (!row) return;
    const r = rows[row.rowIdx];
    const val = parseFloat(param.value);
    if (!isNaN(val) && val > 0) r.testValue = val;
    if (param.unit) r.unit = param.unit;
  });

  // Apply ratings from OCR to primary rows
  const ratingMap: Array<{ keys: string[]; rowIdx: number }> = [
    { keys: ['ph'], rowIdx: 0 },
    { keys: ['organic carbon'], rowIdx: 2 },
    { keys: ['nitrogen'], rowIdx: 3 },
    { keys: ['phosphorus'], rowIdx: 4 },
    { keys: ['potassium'], rowIdx: 5 },
  ];
  Object.entries(allParameters).forEach(([key, param]) => {
    if (!param.rating) return;
    const kLower = key.toLowerCase();
    const row = ratingMap.find(m => m.keys.some(k => kLower.includes(k)));
    if (!row) return;
    const cleaned = param.rating.replace(/high\/normal/i, 'High').replace(/low\/deficient/i, 'Low');
    if (cleaned) rows[row.rowIdx].rating = cleaned;
  });

  return rows;
}

export default function VerifyForm({ initialValues, allParameters, token, onComplete }: VerifyFormProps) {
  const [values, setValues] = useState<SoilValues>({ ...initialValues });
  const [allRows, setAllRows] = useState<AllParameterRow[]>(() => buildAllRows(initialValues, allParameters));
  const [crop, setCrop] = useState('Wheat');
  const [farmSize, setFarmSize] = useState<number>(1);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (key: keyof SoilValues, raw: string) => {
    const val = parseFloat(raw) || 0;
    setValues(prev => ({ ...prev, [key]: val }));
    // Keep allRows in sync for the primary params
    const rowIdxMap: Record<string, number> = { pH: 0, OC: 2, N: 3, P: 4, K: 5 };
    const idx = rowIdxMap[key];
    if (idx !== undefined) {
      setAllRows(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], testValue: val };
        return next;
      });
    }
  };

  const missingCount = PRIMARY_PARAMS.filter(p => (values[p.key] || 0) === 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const response = await axios.post(
        '/api/scan/verify',
        { crop, farmSize, soilValues: values, allParameters: allRows },
        { headers: { Authorization: `Bearer ${token}` } }
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Warning */}
      {missingCount > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4 flex items-start gap-3"
        >
          <AlertTriangle className="text-yellow-600 mt-0.5 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-gray-800">Complete the Missing Values</h4>
            <p className="text-sm text-gray-700 mt-0.5">
              {missingCount} value(s) are 0. Enter the correct values from the <strong>Test Value</strong> column of your Soil Health Card.
            </p>
          </div>
        </motion.div>
      )}

      <div className="agriculture-card p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center shadow-lg">
            <Edit className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-agriculture">Verify Soil Values</h2>
            <p className="text-gray-500 text-sm">Review &amp; correct the extracted values before analysis</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* 5 Parameter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRIMARY_PARAMS.map((param, idx) => {
              const Icon = param.icon;
              const isEmpty = (values[param.key] || 0) === 0;
              return (
                <motion.div
                  key={param.key}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.07 }}
                  className={`rounded-2xl border-2 p-4 transition-all ${isEmpty ? 'border-red-300 bg-red-50' : param.accent
                    }`}
                >
                  {/* Icon + label */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${param.color} flex items-center justify-center shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-800 text-sm leading-tight">{param.label}</p>
                      {param.unit && (
                        <p className="text-xs text-gray-500">{param.unit}</p>
                      )}
                    </div>
                  </div>

                  {/* Value input */}
                  <input
                    type="number"
                    step={param.step}
                    min="0"
                    value={values[param.key] === 0 ? '' : values[param.key]}
                    onChange={e => handleChange(param.key, e.target.value)}
                    placeholder="Enter value"
                    className={`w-full px-3 py-2.5 rounded-xl border-2 text-center text-xl font-bold text-gray-800 focus:outline-none transition-all ${isEmpty
                        ? 'border-red-400 bg-white focus:border-red-500'
                        : 'border-white bg-white focus:border-green-500'
                      }`}
                  />

                  {/* Normal Level hint */}
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-500">{param.hint}</p>
                    <span className="text-xs font-medium text-gray-600 bg-white/70 px-2 py-0.5 rounded-full border border-gray-200">
                      Ideal: {param.normalLevel}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Hint */}
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <Leaf size={12} className="text-green-500" />
            These 5 parameters (pH, OC, N, P, K) are used to generate fertilizer recommendations.
          </p>

          {/* Crop + Farm size */}
          <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-green-100">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Sprout className="w-4 h-4 text-green-600" />
                Select Crop
              </label>
              <select
                value={crop}
                onChange={e => setCrop(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors bg-white"
              >
                {CROPS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Farm Size (acres)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={Number.isNaN(farmSize) ? '' : farmSize}
                onChange={e => setFarmSize(parseFloat(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-500 focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSaving}
            className="w-full btn-agriculture flex items-center justify-center gap-2 py-4 text-base"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing Soil...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Analyze &amp; Get Recommendations
              </>
            )}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
