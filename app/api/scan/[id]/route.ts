import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SoilScan from '@/models/SoilScan';
import { verifyToken } from '@/lib/jwt';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    // Await params (Next.js 15 requirement)
    const { id } = await params;

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

    const scan = await SoilScan.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!scan) {
      return NextResponse.json(
        { error: 'Scan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: scan,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Get scan error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
