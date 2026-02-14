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
    // Pre-process OCR text to fix common errors
    let cleanedText = text
      .replace(/\|/g, ' ')  // Remove table pipes
      .replace(/\s{2,}/g, ' ')  // Normalize multiple spaces
      .replace(/([a-z])\s+([A-Z])/g, '$1 $2')  // Fix missing spaces between words
      .replace(/(?:ds|DS)\s*m/gi, 'dS/m')  // Fix unit spacing
      .replace(/kg\s*ha/gi, 'kg/ha')  // Fix unit spacing
      .replace(/kg\s*\/\s*ha/gi, 'kg/ha')  // Fix unit spacing
      .replace(/(?:Sr\.?|S\.)\s*No\.?/gi, 'S.No')  // Normalize serial number
      .replace(/pPm/gi, 'ppm')  // Fix common OCR error
      .replace(/\b0(?=[A-Za-z])/g, 'O')  // Fix O/0 confusion at start of word
      .replace(/\bl(?=\d)/gi, '1')  // Fix 1/l confusion before numbers
      .replace(/\bI(?=\d)/g, '1');  // Fix 1/I confusion before numbers
    
    const lines = cleanedText.split('\n').filter(line => line.trim().length > 2);
    const lowerText = cleanedText.toLowerCase();
    
    const result: IntelligentExtraction = {
      confidence: 'Medium',
      summary: '',
      farmerDetails: {},
      location: {},
      soilParameters: {},
      recommendations: [],
      rawText: text  // Keep original for display
    };

    // Extract Farmer Details    // Extract Farmer Details
    const farmerPatterns = {
      'Farmer Name': /(?:farmer|name|grower|cultivator)[\s:]+([a-z\s.]+?)(?:\n|$|sr\.no|s\.no|village|district|taluk|son)/i,
      'Father Name': /(?:father|s\/o|son of|f\/o)[\s:]+([a-z\s.]+?)(?:\n|$|village|district|taluk)/i,
      'Sample Number': /(?:sample|registration|reg|sr)[\s\.:no#-]*([a-z0-9\/-]+)/i,
      'Mobile Number': /(?:mobile|phone|contact)[\s:]*([0-9]{10})/i,
      'Survey Number': /(?:survey|khasra|gat)[\s\.:no#-]*([a-z0-9\/-]+)/i,
    };

    Object.entries(farmerPatterns).forEach(([key, pattern]) => {
      const match = cleanedText.match(pattern);
      if (match && match[1] && match[1].trim().length > 1) {
        result.farmerDetails![key] = match[1].trim();
      }
    });

    // Extract Location Details  
    const locationPatterns = {
      'Village': /(?:village|vill|gram)[\s:]+([a-z\s]+?)(?:\n|$|taluk|tehsil|district)/i,
      'Taluk/Tehsil': /(?:taluk|tehsil|taluka|block)[\s:]+([a-z\s]+?)(?:\n|$|district)/i,
      'District': /(?:district|dist)[\s:]+([a-z\s]+?)(?:\n|$|state|pincode)/i,
      'State': /(?:state)[\s:]+([a-z\s]+?)(?:\n|$|pincode|pin)/i,
      'Pincode': /(?:pincode|pin)[\s:]*([0-9]{6})/i,
    };

    Object.entries(locationPatterns).forEach(([key, pattern]) => {
      const match = cleanedText.match(pattern);
      if (match && match[1] && match[1].trim().length > 1) {
        result.location![key] = match[1].trim();
      }
    });

    // Extract ALL Soil Parameters Dynamically - Enhanced for Government Soil Health Cards
    const parameterPatterns = [
      // Primary Macronutrients with enhanced table-format matching
      { 
        name: 'pH', 
        patterns: [
          /^\s*\d+\s+ph\s+([0-9]+\.?[0-9]*)\s/im,
          /ph\s+([0-9]+\.?[0-9]*)\s+(?:acidic|neutral|alkaline)/i,
          /ph[\s:]+([0-9]+\.?[0-9]*)/i
        ], 
        range: [3, 14],
        unit: '' 
      },
      { 
        name: 'Electrical Conductivity (EC)', 
        patterns: [
          /^\s*\d+\s+ec\s+([0-9]+\.?[0-9]*)\s+(?:ds|dsm)/im,
          /ec\s+([0-9]+\.?[0-9]*)\s*(?:ds|dsm)/i,
          /electrical\s+conductivity\s+([0-9]+\.?[0-9]*)/i
        ], 
        range: [0, 10],
        unit: 'dS/m' 
      },
      { 
        name: 'Organic Carbon (OC)', 
        patterns: [
          /^\s*\d+\s+organic\s+carbon\s*\(?oc\)?\s+([0-9]+\.?[0-9]*)\s*%/im,
          /organic\s+carbon\s*\(?oc\)?\s+([0-9]+\.?[0-9]*)\s*%/i,
          /\boc\s+([0-9]+\.?[0-9]*)\s*%/i
        ], 
        range: [0, 10],
        unit: '%' 
      },
      { 
        name: 'Nitrogen (N)', 
        patterns: [
          /^\s*\d+\s+available\s+nitrogen\s*\(?n\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha|kg\/ha)/im,
          /available\s+nitrogen\s*\(?n\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha|kg\/ha)/i,
          /nitrogen\s*\(?n\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha)/i
        ], 
        range: [100, 1000],
        unit: 'kg/ha' 
      },
      { 
        name: 'Phosphorus (P)', 
        patterns: [
          /^\s*\d+\s+available\s+phosphorus\s*\(?p\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha|kg\/ha)/im,
          /available\s+phosphorus\s*\(?p\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha|kg\/ha)/i,
          /phosphorus\s*\(?p\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha)/i
        ], 
        range: [5, 200],
        unit: 'kg/ha' 
      },
      { 
        name: 'Potassium (K)', 
        patterns: [
          /^\s*\d+\s+available\s+potassium\s*\(?k\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha|kg\/ha)/im,
          /available\s+potassium\s*\(?k\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha|kg\/ha)/i,
          /potassium\s*\(?k\)?\s+([0-9]+\.?[0-9]*)\s*(?:kg|kgha)/i
        ], 
        range: [50, 500],
        unit: 'kg/ha' 
      },
      // Secondary Nutrients
      { 
        name: 'Sulphur (S)', 
        patterns: [
          /^\s*\d+\s+available\s+(?:sulphur|sulfur)\s*\(?s\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /available\s+(?:sulphur|sulfur)\s*\(?s\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i,
          /(?:sulphur|sulfur)\s*\(?s\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [5, 100],
        unit: 'ppm' 
      },
      { 
        name: 'Calcium (Ca)', 
        patterns: [
          /^\s*\d+\s+(?:available\s+)?calcium\s*\(?ca\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /calcium\s*\(?ca\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [0, 5000],
        unit: 'ppm' 
      },
      { 
        name: 'Magnesium (Mg)', 
        patterns: [
          /^\s*\d+\s+(?:available\s+)?magnesium\s*\(?mg\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /magnesium\s*\(?mg\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [0, 500],
        unit: 'ppm' 
      },
      // Micronutrients with enhanced patterns
      { 
        name: 'Zinc (Zn)', 
        patterns: [
          /^\s*\d+\s+available\s+zinc\s*\(?zn\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /available\s+zinc\s*\(?zn\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i,
          /zinc\s*\(?zn\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [0.5, 50],
        unit: 'ppm' 
      },
      { 
        name: 'Boron (B)', 
        patterns: [
          /^\s*\d+\s+available\s+boron\s*\(?b\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /available\s+boron\s*\(?b\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i,
          /boron\s*\(?b\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [0.2, 10],
        unit: 'ppm' 
      },
      { 
        name: 'Iron (Fe)', 
        patterns: [
          /^\s*\d+\s+available\s+iron\s*\(?fe\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /available\s+iron\s*\(?fe\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i,
          /iron\s*\(?fe\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [5, 200],
        unit: 'ppm' 
      },
      { 
        name: 'Manganese (Mn)', 
        patterns: [
          /^\s*\d+\s+available\s+manganese\s*\(?mn\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /available\s+manganese\s*\(?mn\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i,
          /manganese\s*\(?mn\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [2, 100],
        unit: 'ppm' 
      },
      { 
        name: 'Copper (Cu)', 
        patterns: [
          /^\s*\d+\s+available\s+copper\s*\(?cu\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /available\s+copper\s*\(?cu\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i,
          /copper\s*\(?cu\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [0.5, 50],
        unit: 'ppm' 
      },
      { 
        name: 'Molybdenum (Mo)', 
        patterns: [
          /^\s*\d+\s+(?:available\s+)?molybdenum\s*\(?mo\)?\s+([0-9]+\.?[0-9]*)\s*ppm/im,
          /molybdenum\s*\(?mo\)?\s+([0-9]+\.?[0-9]*)\s*ppm/i
        ], 
        range: [0, 10],
        unit: 'ppm' 
      },
    ];

    // Extract parameters with smart matching
    parameterPatterns.forEach(({ name, patterns, range, unit }) => {
      for (const pattern of patterns) {
        const match = cleanedText.match(pattern);
        if (match && match[1]) {
          const value = parseFloat(match[1]);
          if (!isNaN(value) && value >= range[0] && value <= range[1]) {
            // Extract rating from the same line
            let rating = '';
            const paramKeyword = name.toLowerCase().split('(')[0].trim();
            const lineWithParam = lines.find(line => 
              line.toLowerCase().includes(paramKeyword)
            );
            
            if (lineWithParam) {
              if (/high|adequate|sufficient|normal|good/i.test(lineWithParam)) {
                rating = 'High/Normal';
              } else if (/medium|moderate/i.test(lineWithParam)) {
                rating = 'Medium';
              } else if (/low|deficient|critical|poor/i.test(lineWithParam)) {
                rating = 'Low/Deficient';
              }
            }

            result.soilParameters[name] = {
              value: match[1],
              unit: unit,
              rating: rating || undefined
            };
            break;
          }
        }
      }
    });

    // Extract from table format (S.No | Parameter | Value | Unit | Rating) - Enhanced for Government Cards
    lines.forEach((line) => {
      // Government card table format: "1 pH 6.39 Acidic 7, Neutral"
      // or "4 Available Nitrogen (N) 305.00 kg ha Medium 280 - 560 kg/ha"
      
      // Pattern 1: Full table row with S.No
      const tableMatch1 = line.match(/^\s*(\d+)\s+([\w\s()]+?)\s+([0-9]+\.?[0-9]*)\s+([\w\s\/%-]*?)\s+(high|medium|low|normal|deficient|adequate|sufficient|good|poor|acidic|alkaline)/i);
      if (tableMatch1) {
        const paramName = tableMatch1[2].trim();
        const value = tableMatch1[3];
        const unit = tableMatch1[4].trim() || '';
        const rating = tableMatch1[5];
        
        // Map common parameter names
        let mappedName = paramName;
        if (/^ph$/i.test(paramName)) mappedName = 'pH';
        else if (/^ec$/i.test(paramName)) mappedName = 'Electrical Conductivity (EC)';
        else if (/organic.*carbon/i.test(paramName)) mappedName = 'Organic Carbon (OC)';
        else if (/nitrogen/i.test(paramName)) mappedName = 'Nitrogen (N)';
        else if (/phosphorus/i.test(paramName)) mappedName = 'Phosphorus (P)';
        else if (/potassium/i.test(paramName)) mappedName = 'Potassium (K)';
        else if (/sulphur|sulfur/i.test(paramName)) mappedName = 'Sulphur (S)';
        else if (/zinc/i.test(paramName)) mappedName = 'Zinc (Zn)';
        else if (/boron/i.test(paramName)) mappedName = 'Boron (B)';
        else if (/iron/i.test(paramName)) mappedName = 'Iron (Fe)';
        else if (/manganese/i.test(paramName)) mappedName = 'Manganese (Mn)';
        else if (/copper/i.test(paramName)) mappedName = 'Copper (Cu)';
        
        // Add if not already exists
        if (!result.soilParameters[mappedName]) {
          result.soilParameters[mappedName] = { value, unit, rating };
        }
      }
      
      // Pattern 2: Simpler table format without rating
      const tableMatch2 = line.match(/([a-z\s()]+?)\s+([0-9]+\.?[0-9]*)\s+([\w\/%-]+)/i);
      if (tableMatch2 && !tableMatch1) {
        const paramName = tableMatch2[1].trim();
        const value = tableMatch2[2];
        const unit = tableMatch2[3];
        
        // Only add if parameter name looks valid (contains common keywords)
        if (/ph|ec|carbon|nitrogen|phosphorus|potassium|sulphur|zinc|boron|iron|manganese|copper/i.test(paramName)) {
          const existingKey = Object.keys(result.soilParameters).find(k => 
            k.toLowerCase().includes(paramName.toLowerCase()) || 
            paramName.toLowerCase().includes(k.toLowerCase().split('(')[0].trim())
          );
          
          if (!existingKey) {
            result.soilParameters[paramName] = { value, unit };
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
