import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Initialize Tesseract worker
    const worker = await createWorker('eng');
    
    const { data: { text } } = await worker.recognize(buffer);
    await worker.terminate();

    // Extract nutrient values using regex
    const extractedValues = extractNutrientValues(text);

    return NextResponse.json(
      {
        success: true,
        extractedText: text,
        soilValues: extractedValues,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('OCR error:', error);
    return NextResponse.json(
      { error: error.message || 'OCR processing failed' },
      { status: 500 }
    );
  }
}

function extractNutrientValues(text: string): any {
  // Regular expressions to extract nutrient values
  const patterns = {
    N: /nitrogen[:\s]*([0-9]+\.?[0-9]*)/i,
    P: /phosphorus[:\s]*([0-9]+\.?[0-9]*)/i,
    K: /potassium[:\s]*([0-9]+\.?[0-9]*)/i,
    OC: /organic[:\s]*carbon[:\s]*([0-9]+\.?[0-9]*)/i,
    pH: /ph[:\s]*([0-9]+\.?[0-9]*)/i,
  };

  const values: any = {
    N: 0,
    P: 0,
    K: 0,
    OC: 0,
    pH: 0,
  };

  // Try to extract each nutrient value
  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      values[key] = parseFloat(match[1]);
    }
  }

  // Alternative patterns for common formats
  const altPatterns = {
    N: /N[:\s]*([0-9]+\.?[0-9]*)/,
    P: /P[:\s]*([0-9]+\.?[0-9]*)/,
    K: /K[:\s]*([0-9]+\.?[0-9]*)/,
    OC: /OC[:\s]*([0-9]+\.?[0-9]*)/,
  };

  for (const [key, pattern] of Object.entries(altPatterns)) {
    if (values[key] === 0) {
      const match = text.match(pattern);
      if (match && match[1]) {
        values[key] = parseFloat(match[1]);
      }
    }
  }

  return values;
}
