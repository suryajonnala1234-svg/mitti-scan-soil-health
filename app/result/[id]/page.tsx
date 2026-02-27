'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft,
  TrendingUp,
  CheckCircle,
  IndianRupee,
  Sprout,
  Leaf,
  Share2,
  Download,
} from 'lucide-react';
import FertilizerCard from '@/components/FertilizerCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { CROP_STANDARDS } from '@/lib/nutrientAnalysis';

interface SoilParameter {
  srNo: number;
  parameter: string;
  testValue: number;
  unit: string;
  rating: string;
  normalLevel: string;
}

function getRatingBadge(rating: string) {
  if (!rating) return null;
  const r = rating.toLowerCase();
  let color = 'bg-gray-100 text-gray-600';
  if (r.includes('sufficient') || r.includes('normal') || r.includes('neutral'))
    color = 'bg-green-500 text-white';
  else if (r.includes('high')) color = 'bg-green-600 text-white';
  else if (r.includes('medium')) color = 'bg-yellow-500 text-white';
  else if (r.includes('low') || r.includes('deficient') || r.includes('critical'))
    color = 'bg-orange-400 text-white';
  else if (r.includes('acidic') || r.includes('alkaline'))
    color = 'bg-yellow-200 text-gray-800';

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${color}`}>
      {rating}
    </span>
  );
}

// Fallback 12-row template when allParameters not stored
const PARAM_TEMPLATE = [
  { srNo: 1, parameter: 'pH', unit: '', normalLevel: '7, Neutral' },
  { srNo: 2, parameter: 'EC', unit: 'dS/m', normalLevel: '0 - 2 dS/m' },
  { srNo: 3, parameter: 'Organic Carbon (OC)', unit: '%', normalLevel: '0.51 - 0.75%' },
  { srNo: 4, parameter: 'Available Nitrogen (N)', unit: 'kg/ha', normalLevel: '280 - 560 kg/ha' },
  { srNo: 5, parameter: 'Available Phosphorus (P)', unit: 'kg/ha', normalLevel: '11-26 kg/ha' },
  { srNo: 6, parameter: 'Available Potassium (K)', unit: 'kg/ha', normalLevel: '120-280 kg/ha' },
  { srNo: 7, parameter: 'Available Sulphur (S)', unit: 'ppm', normalLevel: '> 10 ppm' },
  { srNo: 8, parameter: 'Available Zinc (Zn)', unit: 'ppm', normalLevel: '> 0.6 ppm' },
  { srNo: 9, parameter: 'Available Boron (B)', unit: 'ppm', normalLevel: '> 0.5 ppm' },
  { srNo: 10, parameter: 'Available Iron (Fe)', unit: 'ppm', normalLevel: '> 4.5 ppm' },
  { srNo: 11, parameter: 'Available Manganese (Mn)', unit: 'ppm', normalLevel: '> 2.0 ppm' },
  { srNo: 12, parameter: 'Available Copper (Cu)', unit: 'ppm', normalLevel: '> 0.2 ppm' },
];

function buildDisplayRows(scanData: any): SoilParameter[] {
  // If allParameters saved (new scans), use directly
  if (scanData.allParameters && scanData.allParameters.length > 0) {
    return scanData.allParameters;
  }
  // Fallback for old scans: build from soilValues
  const sv = scanData.soilValues;
  return PARAM_TEMPLATE.map(t => {
    let testValue = 0;
    if (t.srNo === 1) testValue = sv.pH;
    else if (t.srNo === 3) testValue = sv.OC;
    else if (t.srNo === 4) testValue = sv.N;
    else if (t.srNo === 5) testValue = sv.P;
    else if (t.srNo === 6) testValue = sv.K;
    return { ...t, testValue, rating: '' };
  });
}

export default function ResultPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const scanId = params?.id as string;

  const [scanData, setScanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token && scanId) fetchScanData();
  }, [token, scanId]);

  const fetchScanData = async () => {
    try {
      const response = await axios.get(`/api/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScanData(response.data.data);
    } catch {
      alert('Failed to load scan data');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto" />
          <p className="mt-4 text-green-800 font-semibold">Loading Results...</p>
        </div>
      </div>
    );
  }

  if (!scanData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load scan data</p>
          <button onClick={() => router.push('/dashboard')} className="mt-4 btn-agriculture">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const idealValues = CROP_STANDARDS[scanData.crop];
  const totalCost = scanData.recommendations.reduce(
    (sum: number, rec: any) => sum + rec.cost,
    0
  );

  const displayRows = buildDisplayRows(scanData);

  // Chart data for N/P/K/OC/pH comparison
  const chartData = [
    { nutrient: 'N (kg/ha)', Current: scanData.soilValues.N, Ideal: idealValues?.N ?? 0 },
    { nutrient: 'P (kg/ha)', Current: scanData.soilValues.P, Ideal: idealValues?.P ?? 0 },
    { nutrient: 'K (kg/ha)', Current: scanData.soilValues.K, Ideal: idealValues?.K ?? 0 },
    { nutrient: 'OC (%×100)', Current: (scanData.soilValues.OC * 100).toFixed(1) as any, Ideal: ((idealValues?.OC ?? 0) * 100) },
    { nutrient: 'pH', Current: scanData.soilValues.pH, Ideal: idealValues?.pH ?? 0 },
  ];

  const criticalCount = scanData.deficiencies.filter((d: any) => d.status === 'Critical').length;
  const optimalCount = scanData.deficiencies.filter((d: any) => d.status === 'Optimal').length;

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="agriculture-gradient text-white p-6 shadow-lg">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => router.push('/dashboard')}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} />
              </motion.button>
              <div>
                <h1 className="text-2xl font-bold">Soil Health Analysis</h1>
                <p className="text-sm opacity-90">
                  {scanData.crop} · {scanData.farmSize} acres ·{' '}
                  {new Date(scanData.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <motion.button whileHover={{ scale: 1.05 }} className="bg-white/20 hover:bg-white/30 p-3 rounded-lg">
                <Share2 size={20} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.05 }} className="bg-white/20 hover:bg-white/30 p-3 rounded-lg">
                <Download size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 mt-6 space-y-6">

        {/* ─── Overall health badge ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="agriculture-card p-6 flex items-center justify-between"
        >
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-1">Overall Soil Health</h2>
            <p className="text-gray-600 text-sm">
              {optimalCount} of {scanData.deficiencies.length} parameters at optimal level
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-2">
              {criticalCount > 0 ? '🔴' : optimalCount >= 3 ? '🟢' : '🟡'}
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {criticalCount > 0 ? 'Needs Urgent Attention' : optimalCount >= 3 ? 'Good Health' : 'Needs Attention'}
            </p>
          </div>
        </motion.div>

        {/* ─── Soil Test Results Table ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="agriculture-card overflow-hidden"
        >
          {/* Table header banner */}
          <div className="bg-yellow-400 text-center py-3">
            <h2 className="text-lg font-bold text-gray-900">Soil Test Results</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-green-700 text-white">
                  <th className="px-4 py-3 text-center font-semibold">Sr.No.</th>
                  <th className="px-4 py-3 text-left font-semibold w-56">Parameter</th>
                  <th className="px-4 py-3 text-center font-semibold">Test<br />Value</th>
                  <th className="px-4 py-3 text-center font-semibold">Unit</th>
                  <th className="px-4 py-3 text-center font-semibold">Rating</th>
                  <th className="px-4 py-3 text-center font-semibold">Normal Level</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, idx) => (
                  <motion.tr
                    key={row.srNo}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.05 * idx }}
                    className={`border-b border-green-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-green-50/40'}`}
                  >
                    <td className="px-4 py-3 text-center font-medium text-gray-500">{row.srNo}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{row.parameter}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xl font-bold text-green-700">
                        {row.testValue > 0 ? row.testValue : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">{row.unit}</td>
                    <td className="px-4 py-3 text-center">
                      {row.rating ? getRatingBadge(row.rating) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 text-xs whitespace-nowrap">{row.normalLevel}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ─── Comparison Chart ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="agriculture-card p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-1 flex items-center gap-2">
            <TrendingUp className="text-green-600" size={22} />
            Current vs Ideal Levels
          </h2>
          <p className="text-xs text-gray-500 mb-4">OC is multiplied by 100 for visual scale</p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="nutrient" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #d1fae5' }}
                formatter={(value: any, name: string) => [value, name]}
              />
              <Legend />
              <Bar dataKey="Current" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Current" />
              <Bar dataKey="Ideal" fill="#10b981" radius={[4, 4, 0, 0]} name="Ideal" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* ─── Deficiency Summary ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="agriculture-card p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Leaf className="text-green-600" size={22} />
            Nutrient Status Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scanData.deficiencies.map((def: any, idx: number) => {
              const statusColor =
                def.status === 'Optimal' ? 'border-green-300 bg-green-50 text-green-700' :
                  def.status === 'Critical' ? 'border-red-300 bg-red-50 text-red-700' :
                    'border-orange-300 bg-orange-50 text-orange-700';
              const icon =
                def.status === 'Optimal' ? '✅' :
                  def.status === 'Critical' ? '🔴' : '🟡';
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + idx * 0.05 }}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 ${statusColor}`}
                >
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="font-bold text-sm">{def.nutrient}</p>
                    <p className="text-xs opacity-80">
                      {def.status}
                      {def.deficiency > 0 ? ` · ${def.deficiency}% below ideal` : ''}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ─── Fertilizer Recommendations ─── */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sprout className="text-green-600" size={22} />
            Fertilizer Recommendations
          </h2>
          {scanData.recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {scanData.recommendations.map((rec: any, index: number) => (
                <FertilizerCard
                  key={index}
                  fertilizer={rec.fertilizer}
                  quantity={rec.quantity}
                  unit={rec.unit}
                  cost={rec.cost}
                  priority={rec.priority}
                />
              ))}
            </div>
          ) : (
            <div className="agriculture-card p-8 text-center">
              <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
              <p className="text-lg font-semibold text-gray-800">
                Great! Your soil is in optimal condition.
              </p>
              <p className="text-gray-600 mt-2">No additional fertilizers needed at this time.</p>
            </div>
          )}
        </div>

        {/* ─── Cost Summary ─── */}
        {scanData.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="agriculture-card p-6 bg-gradient-to-r from-orange-50 to-yellow-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Total Investment Required</h3>
                <p className="text-sm text-gray-600">
                  For {scanData.farmSize} acres of {scanData.crop}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-4xl font-bold text-orange-700">
                  <IndianRupee size={36} />
                  {totalCost.toLocaleString('en-IN')}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {scanData.recommendations.length} product(s)
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── Actions ─── */}
        <div className="flex gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/scanner')}
            className="flex-1 btn-agriculture"
          >
            Scan Another Card
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-white border-2 border-green-600 text-green-700 font-semibold py-3 px-6 rounded-xl hover:bg-green-50 transition-all"
          >
            View All Scans
          </motion.button>
        </div>
      </div>
    </div>
  );
}
