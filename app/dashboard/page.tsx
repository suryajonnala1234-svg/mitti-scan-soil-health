'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Sprout,
  Camera,
  History,
  LogOut,
  User,
  TrendingUp,
  Leaf,
} from 'lucide-react';

interface ScanHistory {
  _id: string;
  crop: string;
  farmSize: number;
  createdAt: string;
  recommendations: any[];
}

export default function DashboardPage() {
  const { user, logout, token, isLoading } = useAuth();
  const router = useRouter();
  const [scans, setScans] = useState<ScanHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token) {
      fetchHistory();
    }
  }, [token]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/scan/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setScans(response.data.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-green-600 mx-auto"></div>
          <p className="mt-4 text-green-800 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="agriculture-gradient text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="bg-white/20 p-3 rounded-xl"
              >
                <Sprout size={32} />
              </motion.div>
              <div>
                <h1 className="text-2xl font-bold">Mitti-Scan</h1>
                <p className="text-sm opacity-90">Welcome, {user.name}!</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
            >
              <LogOut size={24} />
            </motion.button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6 mt-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02, y: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/scanner')}
            className="agriculture-card p-6 text-left group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-green-100 opacity-10 transform translate-x-4 -translate-y-4">
              <Camera size={120} />
            </div>
            <div className="relative z-10">
              <div className="bg-green-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Camera className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Scan Soil Card
              </h3>
              <p className="text-gray-600">
                Upload or capture your Soil Health Card
              </p>
            </div>
          </motion.button>

          <motion.div
            whileHover={{ scale: 1.02, y: -5 }}
            className="agriculture-card p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 text-yellow-100 opacity-10 transform translate-x-4 -translate-y-4">
              <TrendingUp size={120} />
            </div>
            <div className="relative z-10">
              <div className="bg-yellow-600 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <TrendingUp className="text-white" size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Total Scans
              </h3>
              <p className="text-3xl font-bold text-agriculture">
                {scans.length}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Scan History */}
        <div className="agriculture-card p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-green-600 w-10 h-10 rounded-lg flex items-center justify-center">
              <History className="text-white" size={20} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Scan History</h2>
          </div>

          {loadingHistory ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading history...</p>
            </div>
          ) : scans.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Leaf className="mx-auto text-gray-300 mb-4" size={64} />
              <p className="text-gray-600 text-lg mb-4">
                No scans yet. Start by scanning your first Soil Health Card!
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/scanner')}
                className="btn-agriculture"
              >
                Scan Now
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {scans.map((scan, index) => (
                <motion.div
                  key={scan._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => router.push(`/result/${scan._id}`)}
                  className="bg-gradient-to-r from-green-50 to-yellow-50 p-4 rounded-xl border-2 border-green-100 hover:border-green-300 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Sprout className="text-green-600" size={20} />
                        <span className="font-bold text-gray-800">
                          {scan.crop}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-600">
                          {scan.farmSize} acres
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {scan.recommendations.length} recommendations
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(scan.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-green-600">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Features Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: Camera,
              title: 'OCR Technology',
              desc: 'Auto-extract soil data',
            },
            {
              icon: TrendingUp,
              title: 'Smart Analysis',
              desc: 'AI-powered insights',
            },
            {
              icon: Leaf,
              title: 'Crop Specific',
              desc: 'Tailored recommendations',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-green-200 text-center"
            >
              <feature.icon className="mx-auto text-green-600 mb-2" size={32} />
              <h4 className="font-bold text-gray-800 mb-1">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
