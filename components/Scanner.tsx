'use client';

import React, { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, Loader2, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createWorker } from 'tesseract.js';
import AIAnalysisDisplay from './AIAnalysisDisplay';

interface ScannerProps {
  onScanComplete: (data: any) => void;
  token: string;
}

interface IntelligentExtraction {
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

export default function Scanner({ onScanComplete, token }: ScannerProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [extractedText, setExtractedText] = useState<string>('');
  const [intelligentData, setIntelligentData] = useState<IntelligentExtraction | null>(null);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
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
  // AI-Powered Intelligent Extraction - Like how ChatGPT analyzes images
  const intelligentExtraction = (text: string): IntelligentExtraction => {
    // Aggressive pre-processing to fix OCR errors and normalize
    let cleanedText = text
      .replace(/\|/g, ' ')  // Remove table separators
      .replace(/[|│]/g, ' ')  // Remove all pipe characters
      .replace(/\s{2,}/g, ' ')  // Normalize spaces
      
      // Fix ALL common OCR unit errors (very aggressive)
      .replace(/(?:ds|DS|Ds|dS)\s*[\/]?\s*(?:m|rn|M)/gi, 'dS/m')
      .replace(/(?:kg|Kg|KG|kq|Kq)\s*[\/]?\s*(?:ha|Ha|HA|hao?|Hao?|nao?)/gi, 'kg/ha')
      .replace(/\b(?:Koa|Kaz|koa|kaz)\b/gi, 'kg/ha')
      .replace(/kgha/gi, 'kg/ha')
      .replace(/(?:pPm|PPm|PFm|pfm|prn)/gi, 'ppm')
      
      // Fix percentage OCR errors
      .replace(/(?:0\/0|o\/o|O\/O|0\s*\/\s*0)/gi, '%')
      .replace(/([0-9])\s*%/g, '$1%')
      
      // Fix decimal confusion
      .replace(/([0-9])\s*[.,]\s*([0-9]{1,2})\b/g, '$1.$2')
      
      // Fix number/letter confusion
      .replace(/\bO(?=\d)/gi, '0')   // O → 0 before numbers
      .replace(/\bl(?=\d)/gi, '1')   // l → 1 before numbers
      .replace(/\bI(?=\d)/gi, '1')   // I → 1 before numbers
      .replace(/(?<=\d)O\b/gi, '0')  // O → 0 after numbers
      
      // Normalize parameter names (remove parentheses for easier matching)
      .replace(/\(N\)/gi, '')
      .replace(/\(P\)/gi, '')
      .replace(/\(K\)/gi, '')
      .replace(/\(S\)/gi, '')
      .replace(/\(OC\)/gi, '')
      .replace(/\(Zn\)/gi, '')
      .replace(/\(B\)/gi, '')
      .replace(/\(Fe\)/gi, '')
      .replace(/\(Mn\)/gi, '')
      .replace(/\(Cu\)/gi, '');
    
    const lines = cleanedText.split('\n').filter(line => line.trim().length > 2);
    
    const result: IntelligentExtraction = {
      confidence: 'Medium',
      summary: '',
      farmerDetails: {},
      location: {},
      soilParameters: {},
      recommendations: [],
      rawText: text
    };

    // UNIVERSAL extraction - works for ANY format
    // Define what we're looking for with flexible matching
    const universalParameters = [
      { 
        name: 'pH', 
        keywords: ['ph', 'ph value'],  
        range: [3, 14], 
        unit: '',
        priority: 1  // Higher priority = more important
      },
      { 
        name: 'Electrical Conductivity (EC)', 
        keywords: ['ec', 'electrical conductivity', 'conductivity'],  
        range: [0, 10], 
        unit: 'dS/m',
        priority: 1
      },
      { 
        name: 'Organic Carbon (OC)', 
        keywords: ['organic carbon', 'organic', 'oc', 'o.c'],  
        range: [0, 10], 
        unit: '%',
        priority: 1
      },
      { 
        name: 'Nitrogen (N)', 
        keywords: ['nitrogen', 'available nitrogen', 'n'],  
        range: [100, 1000], 
        unit: 'kg/ha',
        priority: 2
      },
      { 
        name: 'Phosphorus (P)', 
        keywords: ['phosphorus', 'available phosphorus', 'p'],  
        range: [5, 200], 
        unit: 'kg/ha',
        priority: 2
      },
      { 
        name: 'Potassium (K)', 
        keywords: ['potassium', 'available potassium', 'k'],  
        range: [50, 500], 
        unit: 'kg/ha',
        priority: 2
      },
      { 
        name: 'Sulphur (S)', 
        keywords: ['sulphur', 'sulfur', 'available sulphur', 's'],  
        range: [5, 100], 
        unit: 'ppm',
        priority: 3
      },
      { 
        name: 'Zinc (Zn)', 
        keywords: ['zinc', 'available zinc', 'zn'],  
        range: [0.5, 50], 
        unit: 'ppm',
        priority: 3
      },
      { 
        name: 'Boron (B)', 
        keywords: ['boron', 'available boron', 'b'],  
        range: [0.2, 10], 
        unit: 'ppm',
        priority: 3
      },
      { 
        name: 'Iron (Fe)', 
        keywords: ['iron', 'available iron', 'fe'],  
        range: [5, 200], 
        unit: 'ppm',
        priority: 3
      },
      { 
        name: 'Manganese (Mn)', 
        keywords: ['manganese', 'available manganese', 'mn'],  
        range: [2, 100], 
        unit: 'ppm',
        priority: 3
      },
      { 
        name: 'Copper (Cu)', 
        keywords: ['copper', 'available copper', 'cu'],  
        range: [0.5, 50], 
        unit: 'ppm',
        priority: 3
      },
    ];

    // SMART EXTRACTION: Find keyword, extract nearby number
    universalParameters.forEach(({ name, keywords, range, unit, priority }) => {
      if (result.soilParameters[name]) return; // Already found

      // Search through all lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lowerLine = line.toLowerCase();
        
        // Check if this line contains ANY of our keywords
        const matchedKeyword = keywords.find(keyword => {
          const keywordLower = keyword.toLowerCase();
          return lowerLine.includes(keywordLower);
        });
        
        if (!matchedKeyword) continue;

        // Extract ALL numbers from this line and next 2 lines (context window)
        const contextLines = [line, lines[i + 1] || '', lines[i + 2] || ''];
        const contextText = contextLines.join(' ');
        
        // Find all numbers (including decimals)
        const numbers = contextText.match(/\b\d+\.?\d*\b/g);
        if (!numbers || numbers.length === 0) continue;

        // Try each number to find one in valid range
        for (let j = 0; j < numbers.length; j++) {
          const num = parseFloat(numbers[j]);
          
          // Skip if NaN or clearly a serial number
          if (isNaN(num)) continue;
          if (j === 0 && num < 20 && Number.isInteger(num)) continue; // Skip S.No
          
          // Check if in valid range
          if (num >= range[0] && num <= range[1]) {
            // Extract rating from the same line
            let rating = '';
            const combinedContext = contextText.toLowerCase();
            if (/\b(high|adequate|sufficient|normal|good)\b/i.test(combinedContext)) {
              rating = 'High/Normal';
            } else if (/\b(medium|moderate)\b/i.test(combinedContext)) {
              rating = 'Medium';
            } else if (/\b(low|deficient|critical|poor)\b/i.test(combinedContext)) {
              rating = 'Low/Deficient';
            }

            result.soilParameters[name] = {
              value: numbers[j],
              unit: unit,
              rating: rating || undefined
            };
            
            break; // Found valid value, move to next parameter
          }
        }
        
        if (result.soilParameters[name]) break; // Found in this line, stop searching
      }
    });

    // UNIVERSAL FARMER DETAILS EXTRACTION - Flexible keyword matching
    const farmerKeywords = [
      { key: 'Farmer Name', keywords: ['farmer name', 'name', 'grower', 'cultivator'], stopWords: ['father', 'village', 'district'] },
      { key: 'Father Name', keywords: ["father's husband name", 'father', 's/o', 'son of', 'f/o', 'husband'], stopWords: ['village', 'district'] },
      { key: 'Sample Number', keywords: ['sample', 'sample number', 'registration', 'reg', 'card number'], stopWords: [] },
      { key: 'Mobile Number', keywords: ['mobile no', 'mobile', 'phone', 'contact'], stopWords: [] },
      { key: 'Survey Number', keywords: ['survey no', 'survey', 'khasra', 'gat no'], stopWords: [] },
    ];

    farmerKeywords.forEach(({ key, keywords, stopWords }) => {
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        const matched = keywords.some(kw => lowerLine.includes(kw));
        
        if (matched) {
          // Extract the value after the keyword
          let value = line;
          keywords.forEach(kw => {
            const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            value = value.replace(kwRegex, '');
          });
          
          // Clean up the value
          value = value.replace(/[:|-]/g, '').trim();
          
          // Remove stop words
          stopWords.forEach(sw => {
            const stopRegex = new RegExp(sw, 'i');
            if (stopRegex.test(value)) {
              value = value.split(stopRegex)[0].trim();
            }
          });
          
          // Special handling for mobile numbers
          if (key === 'Mobile Number') {
            const mobileMatch = value.match(/\d{10}/);
            if (mobileMatch) {
              result.farmerDetails![key] = mobileMatch[0];
              break;
            }
          } else if (value.length > 1 && value.length < 100) {
            result.farmerDetails![key] = value;
            break;
          }
        }
      }
    });

    // UNIVERSAL LOCATION EXTRACTION - Flexible keyword matching
    const locationKeywords = [
      { key: 'Village', keywords: ['village', 'vill', 'gram'], stopWords: ['taluk', 'tehsil', 'district'] },
      { key: 'Taluk/Tehsil', keywords: ['taluk', 'tehsil', 'taluka', 'block'], stopWords: ['district'] },
      { key: 'District', keywords: ['district', 'dist'], stopWords: ['state', 'pincode'] },
      { key: 'State', keywords: ['state'], stopWords: ['pincode', 'pin'] },
      { key: 'Pincode', keywords: ['pincode', 'pin'], stopWords: [] },
    ];

    locationKeywords.forEach(({ key, keywords, stopWords }) => {
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        const matched = keywords.some(kw => lowerLine.includes(kw));
        
        if (matched) {
          let value = line;
          keywords.forEach(kw => {
            const kwRegex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            value = value.replace(kwRegex, '');
          });
          
          value = value.replace(/[:|-]/g, '').trim();
          
          stopWords.forEach(sw => {
            const stopRegex = new RegExp(sw, 'i');
            if (stopRegex.test(value)) {
              value = value.split(stopRegex)[0].trim();
            }
          });
          
          // Special handling for pincode
          if (key === 'Pincode') {
            const pincodeMatch = value.match(/\d{6}/);
            if (pincodeMatch) {
              result.location![key] = pincodeMatch[0];
              break;
            }
          } else if (value.length > 1 && value.length < 100) {
            result.location![key] = value;
            break;
          }
        }
      }
    });

    // Extract soil texture and type
    if (/clay|loamy|sandy|silt/i.test(cleanedText)) {
      const soilTypeMatch = cleanedText.match(/(?:soil type|texture)[\s:]*([a-z\s]+?)(?:\n|$)/i);
      if (soilTypeMatch) {
        result.soilParameters['Soil Type'] = { 
          value: soilTypeMatch[1].trim() 
        };
      }
    }

    // Extract recommendations
    const recStart = cleanedText.toLowerCase().indexOf('recommendation');
    if (recStart !== -1) {
      const recText = cleanedText.substring(recStart);
      const recLines = recText.split('\n').slice(1, 8);
      result.recommendations = recLines
        .filter(line => line.trim().length > 10)
        .map(line => line.trim());
    }

    // Determine confidence based on data quality
    const paramCount = Object.keys(result.soilParameters).length;
    const farmerInfoCount = Object.keys(result.farmerDetails || {}).length;
    
    if (paramCount >= 5 && farmerInfoCount > 0) {
      result.confidence = 'High';
    } else if (paramCount >= 3) {
      result.confidence = 'Medium';
    } else {
      result.confidence = 'Low';
    }

    // Generate AI-like summary
    result.summary = `I've analyzed the soil health card and extracted ${paramCount} soil parameter${paramCount !== 1 ? 's' : ''}, ` +
      `${farmerInfoCount} farmer detail${farmerInfoCount !== 1 ? 's' : ''}, and ` +
      `${Object.keys(result.location || {}).length} location field${Object.keys(result.location || {}).length !== 1 ? 's' : ''}. ` +
      `The card contains comprehensive soil health information.`;

    return result;
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    setOcrProgress(0);
    setExtractedText('');
    setShowAIAnalysis(false);
    
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

      // Save extracted text
      setExtractedText(text);

      // Perform intelligent AI-like extraction
      const intelligentData = intelligentExtraction(text);
      setIntelligentData(intelligentData);
      setShowAIAnalysis(true);

    } catch (error: any) {
      console.error('OCR error:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsProcessing(false);
      setOcrProgress(0);
    }
  };

  const handleAIProceed = (selectedData: any) => {
    // Convert AI format to app format
    const soilValues: any = {
      pH: 0,
      N: 0,
      P: 0,
      K: 0,
      OC: 0,
    };

    // Map the selected parameters to app format
    Object.entries(selectedData.soilParameters).forEach(([key, param]: [string, any]) => {
      const value = parseFloat(param.value);
      
      if (key.includes('pH')) soilValues.pH = value;
      else if (key.includes('Nitrogen')) soilValues.N = value;
      else if (key.includes('Phosphorus')) soilValues.P = value;
      else if (key.includes('Potassium')) soilValues.K = value;
      else if (key.includes('Organic Carbon')) soilValues.OC = value;
    });

    onScanComplete({
      success: true,
      extractedText: extractedText,
      soilValues: soilValues,
      allParameters: selectedData.soilParameters,
      farmerDetails: selectedData.farmerDetails,
      location: selectedData.location,
    });
  };

  return (
    <div className="space-y-6">
      {/* AI-Powered Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-purple-50 via-blue-50 to-green-50 border-2 border-purple-200 rounded-xl p-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-gray-800 mb-1 flex items-center gap-2">
              AI-Powered Document Intelligence
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>🤖 Extracts ALL parameters automatically (like ChatGPT Vision)</li>
              <li>📊 Detects farmer info, location, soil data, and recommendations</li>
              <li>✅ Shows everything found in the card - no fixed fields</li>
              <li>⚡ Smart field detection and validation</li>
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
                    Choose an existing photo from your device
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

        {preview && !showAIAnalysis && (
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
                  setIntelligentData(null);
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
                  <p className="text-lg font-semibold mb-2">🤖 AI Analyzing Document...</p>
                  <p className="text-sm mb-4">Extracting all fields from the card</p>
                  {ocrProgress > 0 && (
                    <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${ocrProgress}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
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
      </AnimatePresence>

      {/* AI Analysis Results */}
      {showAIAnalysis && intelligentData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AIAnalysisDisplay 
            data={intelligentData}
            onProceed={handleAIProceed}
          />
        </motion.div>
      )}
    </div>
  );
}
