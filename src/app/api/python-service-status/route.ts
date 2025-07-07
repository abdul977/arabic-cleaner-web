import { NextResponse } from 'next/server';
import { pythonServiceClient } from '@/lib/python-service-client';

export async function GET() {
  try {
    const isAvailable = await pythonServiceClient.isServiceAvailable();
    
    return NextResponse.json({
      available: isAvailable,
      timestamp: new Date().toISOString(),
      service_url: process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
    });
  } catch (error) {
    console.error('Error checking Python service status:', error);
    
    return NextResponse.json({
      available: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}
