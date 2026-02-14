'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import Scanner from '@/components/Scanner';
import VerifyForm from '@/components/VerifyForm';

export default function ScannerPage() {
  const { user, token, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<'scan' | 'verify'>('scan');
  const [extractedData, setExtractedData] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const handleScanComplete = (data: any) => {
    setExtractedData(data);
    setStep('verify');
  };

  const handleAnalysisComplete = (scanId: string) => {
    router.push(`/result/${scanId}`);
  };

  if (isLoading || !user || !token) {
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
          <div className="flex items-center space-x-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => step === 'verify' ? setStep('scan') : router.push('/dashboard')}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold">
                {step === 'scan' ? 'Scan Soil Health Card' : 'Verify & Analyze'}
              </h1>
              <p className="text-sm opacity-90">
                {step === 'scan' 
                  ? 'Upload or capture your soil health card' 
                  : 'Review and correct the extracted values'}
              </p>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="mt-6 flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'scan'
                    ? 'bg-white text-green-600'
                    : 'bg-green-800 text-white'
                }`}
              >
                {step === 'verify' ? <CheckCircle size={18} /> : '1'}
              </div>
              <span className="text-sm font-medium">Scan</span>
            </div>
            <div className="w-16 h-1 bg-white/30 rounded">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: step === 'verify' ? '100%' : '0%' }}
                className="h-full bg-white rounded"
              />
            </div>
            <div className="flex items-center space-x-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step === 'verify'
                    ? 'bg-white text-green-600'
                    : 'bg-white/30 text-white'
                }`}
              >
                2
              </div>
              <span className="text-sm font-medium">Verify</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-4 mt-6">
        {step === 'scan' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Scanner onScanComplete={handleScanComplete} token={token} />
          </motion.div>
        )}

        {step === 'verify' && extractedData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <VerifyForm
              initialValues={extractedData.soilValues}
              token={token}
              onComplete={handleAnalysisComplete}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}
