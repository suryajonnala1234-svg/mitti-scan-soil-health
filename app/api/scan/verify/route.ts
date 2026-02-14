import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SoilScan from '@/models/SoilScan';
import { verifyToken } from '@/lib/jwt';
import { analyzeSoilHealth } from '@/lib/nutrientAnalysis';
import { calculateFertilizerRecommendations } from '@/lib/fertilizerRecommendation';

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Get token from header
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const { crop, farmSize, soilValues } = await req.json();

    // Validate input
    if (!crop || !farmSize || !soilValues) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Analyze soil health
    const deficiencies = analyzeSoilHealth(soilValues, crop);

    // Calculate fertilizer recommendations
    const recommendations = calculateFertilizerRecommendations(
      soilValues,
      crop,
      farmSize,
      deficiencies
    );

    // Save to database
    const soilScan = await SoilScan.create({
      userId: decoded.userId,
      crop,
      farmSize,
      soilValues,
      deficiencies,
      recommendations,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Soil scan saved successfully',
        data: soilScan,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
