'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle, AlertCircle, FileText, Leaf, MapPin } from 'lucide-react';

interface ExtractedData {
  confidence: string;
  summary: string;
  farmerDetails?: {
    [key: string]: string;
  };
  location?: {
    [key: string]: string;
  };
  soilParameters: {
    [key: string]: {
      value: string;
      unit?: string;
      rating?: string;
    };
  };
  recommendations?: string[];
  rawText: string;
}

interface AIAnalysisProps {
  data: ExtractedData;
  onProceed: (selectedData: any) => void;
}

export default function AIAnalysisDisplay({ data, onProceed }: AIAnalysisProps) {
  const [selectedParams, setSelectedParams] = React.useState<{[key: string]: boolean}>({});

  React.useEffect(() => {
    // Auto-select all parameters
    const selected: {[key: string]: boolean} = {};
    Object.keys(data.soilParameters).forEach(key => {
      selected[key] = true;
    });
    setSelectedParams(selected);
  }, [data]);

  const orderedEntries = React.useMemo(() => {
    const desiredOrder = [
      'pH',
      'Organic Carbon (OC)',
      'Nitrogen (N)',
      'Phosphorus (P)',
      'Potassium (K)',
      'Sulphur (S)',
      'Iron (Fe)',
      'Electrical Conductivity (EC)',
    ].map(o => o.toLowerCase());

    return Object.entries(data.soilParameters).sort(([a], [b]) => {
      const ai = desiredOrder.indexOf(a.toLowerCase());
      const bi = desiredOrder.indexOf(b.toLowerCase());
      if (ai === -1 && bi === -1) return a.localeCompare(b);
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
  }, [data.soilParameters]);

  const handleProceed = () => {
    const selectedData = {
      farmerDetails: data.farmerDetails,
      location: data.location,
      soilParameters: orderedEntries
        .filter(([key]) => selectedParams[key])
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };
    onProceed(selectedData);
  };

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="agriculture-card p-6 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
              AI Analysis Complete
            </h2>
            <p className="text-gray-700 mb-3">{data.summary}</p>
            <div className="flex items-center gap-2 text-sm">
              <div className={`px-3 py-1 rounded-full ${
                data.confidence === 'High' ? 'bg-green-100 text-green-700' :
                data.confidence === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                Confidence: {data.confidence}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Farmer Details */}
      {data.farmerDetails && Object.keys(data.farmerDetails).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="agriculture-card p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Farmer Information Detected
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(data.farmerDetails).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 font-medium">{key}</p>
                  <p className="text-sm text-gray-800 font-semibold truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Location Details */}
      {data.location && Object.keys(data.location).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="agriculture-card p-6"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            Location Information
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {Object.entries(data.location).map(([key, value]) => (
              <div key={key} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-600 font-medium">{key}</p>
                  <p className="text-sm text-gray-800 font-semibold truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Soil Parameters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="agriculture-card p-6"
      >
        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-green-600" />
          Soil Parameters Extracted ({Object.keys(data.soilParameters).length} found)
        </h3>
        <div className="space-y-3">
          {orderedEntries.map(([key, param], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-yellow-50 rounded-xl border-2 border-green-200 hover:border-green-400 transition-all"
            >
              <input
                type="checkbox"
                checked={selectedParams[key] ?? false}
                onChange={(e) => setSelectedParams(prev => ({ ...prev, [key]: e.target.checked }))}
                className="w-5 h-5 rounded border-2 border-green-600 text-green-600 focus:ring-2 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-gray-800">{key}</span>
                  {param.rating && (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      param.rating.toLowerCase().includes('high') || param.rating.toLowerCase().includes('normal')
                        ? 'bg-green-100 text-green-700'
                        : param.rating.toLowerCase().includes('medium')
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {param.rating}
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-green-700">{param.value}</span>
                  {param.unit && (
                    <span className="text-sm text-gray-600">{param.unit}</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="agriculture-card p-6 bg-gradient-to-r from-orange-50 to-yellow-50"
        >
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            Recommendations Found on Card
          </h3>
          <ul className="space-y-2">
            {data.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-green-600 mt-0.5">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Raw OCR Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="agriculture-card p-6"
      >
        <details className="cursor-pointer">
          <summary className="font-bold text-gray-800 mb-2 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            View Complete OCR Text
          </summary>
          <div className="mt-4 bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto border border-gray-200">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
              {data.rawText}
            </pre>
          </div>
        </details>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleProceed}
          disabled={Object.values(selectedParams).filter(Boolean).length === 0}
          className="flex-1 btn-agriculture flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Continue with Selected Data ({Object.values(selectedParams).filter(Boolean).length} params)
        </motion.button>
      </div>
    </div>
  );
}
