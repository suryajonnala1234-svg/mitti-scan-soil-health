'use client';

import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface ScannerProps {
  onScanComplete: (data: any) => void;
  token: string;
}

export default function Scanner({ onScanComplete, token }: ScannerProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
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
        processImage(result, file);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string, file?: File) => {
    setIsProcessing(true);
    try {
      // Convert base64 to file if needed
      let imageFile = file;
      if (!imageFile) {
        const response = await fetch(imageData);
        const blob = await response.blob();
        imageFile = new File([blob], 'soil-card.jpg', { type: 'image/jpeg' });
      }

      // Send to OCR API
      const formData = new FormData();
      formData.append('image', imageFile);

      const ocrResponse = await axios.post('/api/scan/ocr', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      onScanComplete(ocrResponse.data);
    } catch (error: any) {
      console.error('OCR error:', error);
      alert(error.response?.data?.error || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
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
                }}
                className="absolute top-6 right-6 z-10 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <img src={preview} alt="Preview" className="w-full rounded-xl" />
            {isProcessing && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                <div className="text-center text-white">
                  <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4" />
                  <p className="text-lg font-semibold">Processing Image...</p>
                  <p className="text-sm">Extracting soil data from the card</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
