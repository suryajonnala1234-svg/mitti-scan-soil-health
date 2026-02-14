'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  ArrowLeft,
  Download,
  Share2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  IndianRupee,
  Sprout,
} from 'lucide-react';
import NutrientGauge from '@/components/NutrientGauge';
import FertilizerCard from '@/components/FertilizerCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CROP_STANDARDS } from '@/lib/nutrientAnalysis';

export default function ResultPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const scanId = params?.id as string;

  const [scanData, setScanData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token && scanId) {
      fetchScanData();
    }
  }, [token, scanId]);

  const fetchScanData = async () => {
    try {
      const response = await axios.get(`/api/scan/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScanData(response.data.data);
    } catch (error) {
      console.error('Error fetching scan data:', error);
      alert('Failed to load scan data');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto"></div>
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
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 btn-agriculture"
          >
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

  // Prepare chart data
  const chartData = [
    {
      nutrient: 'N',
      Current: scanData.soilValues.N,
      Ideal: idealValues.N,
    },
    {
      nutrient: 'P',
      Current: scanData.soilValues.P,
      Ideal: idealValues.P,
    },
    {
      nutrient: 'K',
      Current: scanData.soilValues.K,
      Ideal: idealValues.K,
    },
    {
      nutrient: 'OC',
      Current: scanData.soilValues.OC,
      Ideal: idealValues.OC,
    },
    {
      nutrient: 'pH',
      Current: scanData.soilValues.pH,
      Ideal: idealValues.pH,
    },
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="agriculture-gradient text-white p-6 shadow-lg">
        <div className="max-w-6xl mx-auto">
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
                  {scanData.crop} - {scanData.farmSize} acres
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
              >
                <Share2 size={20} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors"
              >
                <Download size={20} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 mt-6 space-y-6">
        {/* Overall Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="agriculture-card p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Overall Soil Health
              </h2>
              <p className="text-gray-600">
                Analysis Date: {new Date(scanData.createdAt).toLocaleDateString('en-IN')}
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-2">
                {scanData.deficiencies.filter((d: any) => d.status === 'Optimal').length >=
                3
                  ? '🟢'
                  : scanData.deficiencies.filter((d: any) => d.status === 'Critical')
                      .length > 0
                  ? '🔴'
                  : '🟡'}
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {scanData.deficiencies.filter((d: any) => d.status === 'Optimal').length >=
                3
                  ? 'Good Health'
                  : 'Needs Attention'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Nutrient Gauges */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="text-green-600" />
            Nutrient Levels
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {scanData.deficiencies.map((def: any, index: number) => (
              <NutrientGauge
                key={index}
                nutrient={def.nutrient}
                value={
                  scanData.soilValues[
                    def.nutrient === 'Nitrogen'
                      ? 'N'
                      : def.nutrient === 'Phosphorus'
                      ? 'P'
                      : def.nutrient === 'Potassium'
                      ? 'K'
                      : def.nutrient === 'Organic Carbon'
                      ? 'OC'
                      : 'pH'
                  ]
                }
                maxValue={
                  idealValues[
                    def.nutrient === 'Nitrogen'
                      ? 'N'
                      : def.nutrient === 'Phosphorus'
                      ? 'P'
                      : def.nutrient === 'Potassium'
                      ? 'K'
                      : def.nutrient === 'Organic Carbon'
                      ? 'OC'
                      : 'pH'
                  ]
                }
                status={def.status}
              />
            ))}
          </div>
        </div>

        {/* Comparison Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="agriculture-card p-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Current vs Ideal Levels
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nutrient" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Current" fill="#f59e0b" />
              <Bar dataKey="Ideal" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Fertilizer Recommendations */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Sprout className="text-green-600" />
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
              <p className="text-gray-600 mt-2">
                No additional fertilizers needed at this time.
              </p>
            </div>
          )}
        </div>

        {/* Cost Summary */}
        {scanData.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="agriculture-card p-6 bg-gradient-to-r from-orange-50 to-yellow-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  Total Investment Required
                </h3>
                <p className="text-sm text-gray-600">
                  For {scanData.farmSize} acres of {scanData.crop}
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-4xl font-bold text-orange-700">
                  <IndianRupee size={36} />
                  {totalCost.toLocaleString()}
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {scanData.recommendations.length} products
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Actions */}
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
