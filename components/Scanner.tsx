'use client';

import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';

interface ScannerProps {
  onScanComplete: (data: any) => void;
  token: string;
}

export default function Scanner({ onScanComplete, token }: ScannerProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showExtractedText, setShowExtractedText] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const capturePhoto = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPreview(imageSrc);
      setShowCamera(false);
      processImage(imageSrc);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreview(result);
        processImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const extractNutrientValues = (text: string): any => {
    // Clean up text - remove extra spaces, normalize
    const cleanText = text.replace(/\s+/g, ' ').trim();
    
    const values: any = {
      N: 0,
      P: 0,
      K: 0,
      OC: 0,
      pH: 0,
    };

    // Advanced multi-pattern extraction
    // Pattern 1: Table format - "Parameter [spaces/tabs] Value"
    const tablePatterns = {
      pH: /ph\s+(?:value)?\s*[:\-|]?\s*([0-9]+\.?[0-9]*)/i,
      N: /(?:available\s+)?nitrogen\s*\(?n\)?\s*[:\-|]?\s*([0-9]+\.?[0-9]*)/i,
      P: /(?:available\s+)?phosphorus\s*\(?p\)?\s*[:\-|]?\s*([0-9]+\.?[0-9]*)/i,
      K: /(?:available\s+)?potassium\s*\(?k\)?\s*[:\-|]?\s*([0-9]+\.?[0-9]*)/i,
      OC: /organic\s+carbon\s*\(?oc\)?\s*[:\-|]?\s*([0-9]+\.?[0-9]*)/i,
    };

    // Pattern 2: Short form - "N: 123" or "N 123"
    const shortPatterns = {
      pH: /\bph\s*[:\-|]?\s*([0-9]+\.?[0-9]*)/i,
      N: /\bn\s*[:\-|]?\s*([0-9]+\.?[0-9]*)\s*(?:kg|ppm)?/i,
      P: /\bp\s*[:\-|]?\s*([0-9]+\.?[0-9]*)\s*(?:kg|ppm)?/i,
      K: /\bk\s*[:\-|]?\s*([0-9]+\.?[0-9]*)\s*(?:kg|ppm)?/i,
      OC: /\boc\s*[:\-|]?\s*([0-9]+\.?[0-9]*)\s*%?/i,
    };

    // Pattern 3: Line-by-line table extraction (Government card format)
    const lines = cleanText.split(/[\n\r]+/);
    const parameterMap: any = {
      'ph': 'pH',
      'nitrogen': 'N',
      'phosphorus': 'P', 
      'potassium': 'K',
      'organic carbon': 'OC',
      'oc': 'OC'
    };

    // Try to extract from table-like structure
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Look for parameter names and extract numbers from the same line
      for (const [param, key] of Object.entries(parameterMap)) {
        if (line.includes(param)) {
          // Extract all numbers from this line
          const numbers = line.match(/([0-9]+\.?[0-9]*)/g);
          if (numbers && numbers.length > 0) {
            // Usually the first substantial number after parameter name
            for (const num of numbers) {
              const numVal = parseFloat(num);
              // Reasonable ranges to filter out S.No and other irrelevant numbers
              if (key === 'pH' && numVal >= 3 && numVal <= 14) {
                values[key] = numVal;
                break;
              } else if (key === 'OC' && numVal >= 0 && numVal <= 10) {
                values[key] = numVal;
                break;
              } else if ((key === 'N' || key === 'P' || key === 'K') && numVal >= 0 && numVal <= 1000) {
                values[key] = numVal;
                break;
              }
            }
          }
        }
      }
    }

    // Apply table patterns if values still zero
    for (const [key, pattern] of Object.entries(tablePatterns)) {
      if (values[key] === 0) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          const numVal = parseFloat(match[1]);
          if (!isNaN(numVal)) {
            values[key] = numVal;
          }
        }
      }
    }

    // Apply short patterns as final fallback
    for (const [key, pattern] of Object.entries(shortPatterns)) {
      if (values[key] === 0) {
        const match = cleanText.match(pattern);
        if (match && match[1]) {
          const numVal = parseFloat(match[1]);
          if (!isNaN(numVal)) {
            values[key] = numVal;
          }
        }
      }
    }

    // Round to 2 decimal places
    Object.keys(values).forEach(key => {
      if (values[key] > 0) {
        values[key] = Math.round(values[key] * 100) / 100;
      }
    });

    return values;
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setOcrProgress(0);
    setExtractedText('');
    setShowExtractedText(false);
    
    try {
      // Create Tesseract worker (client-side)
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        },
      });

      // Perform OCR
      const { data: { text } } = await worker.recognize(imageData);
      await worker.terminate();

      // Save extracted text for user review
      setExtractedText(text);
      setShowExtractedText(true);

      // Extract nutrient values
      const extractedValues = extractNutrientValues(text);

      // Return data to parent component
      onScanComplete({
        success: true,
        extractedText: text,
        soilValues: extractedValues,
      });
    } catch (error: any) {
      console.error('OCR error:', error);
      alert('Failed to process image. Please try again or enter values manually.');
      
      // Return empty values so user can enter manually
      onScanComplete({
        success: false,
        extractedText: '',
        soilValues: {
          N: 0,
          P: 0,
          K: 0,
          OC: 0,
          pH: 0,
        },
      });
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-white text-lg">ℹ️</span>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-1">OCR Processing Tips</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✓ Ensure good lighting for best results</li>
              <li>✓ Keep the card flat and aligned</li>
              <li>✓ OCR may take 10-30 seconds to process</li>
              <li>✓ You can manually edit values after scanning</li>
            </ul>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {!preview && !showCamera && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCamera(true)}
                className="agriculture-card p-8 flex flex-col items-center justify-center gap-4 hover:shadow-2xl transition-all cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center animate-float">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-agriculture mb-2">
                    Capture Photo
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Use your camera to scan the soil health card
                  </p>
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                className="agriculture-card p-8 flex flex-col items-center justify-center gap-4 hover:shadow-2xl transition-all cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
                  <Upload className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-agriculture mb-2">
                    Upload Image
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Choose an existing photo from gallery
                  </p>
                </div>
              </motion.button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </motion.div>
        )}

        {showCamera && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="agriculture-card p-4 relative"
          >
            <button
              onClick={() => setShowCamera(false)}
              className="absolute top-6 right-6 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              className="w-full rounded-xl"
              videoConstraints={{
                facingMode: 'environment',
              }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={capturePhoto}
              className="mt-4 w-full btn-agriculture"
            >
              <Camera className="w-5 h-5 inline-block mr-2" />
              Capture Photo
            </motion.button>
          </motion.div>
        )}

        {preview && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="agriculture-card p-4 relative"
          >
            {!isProcessing && (
              <button
                onClick={() => {
                  setPreview(null);
                  setIsProcessing(false);
                  setExtractedText('');
                  setShowExtractedText(false);
                }}
                className="absolute top-6 right-6 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <img src={preview} alt="Preview" className="w-full rounded-xl" />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/60 rounded-xl flex items-center justify-center">
                <div className="text-center text-white max-w-md px-6">
                  <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold mb-2">Processing Image...</p>
                  <p className="text-sm mb-4">Extracting soil data from the card</p>
                  {ocrProgress > 0 && (
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ocrProgress}%` }}
                        className="h-full bg-green-500 rounded-full"
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                  {ocrProgress > 0 && (
                    <p className="text-xs mt-2 opacity-80">{ocrProgress}% complete</p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Show Extracted Text */}
        {showExtractedText && extractedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="agriculture-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <span className="text-xl">📝</span>
                OCR Extracted Text
              </h3>
              <button
                onClick={() => setShowExtractedText(!showExtractedText)}
                className="text-sm text-green-600 hover:text-green-700 font-medium"
              >
                {showExtractedText ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto border border-gray-200">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
                {extractedText || 'No text extracted'}
              </pre>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              💡 Review this text to understand what OCR detected. Verify values in the next step.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
