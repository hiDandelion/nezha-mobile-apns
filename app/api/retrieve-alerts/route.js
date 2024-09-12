import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.REDIS_URL,
  token: process.env.REDIS_TOKEN,
})

export async function POST(request) {
  const { iOSDeviceToken } = await request.json();

  // Reject request if no device token is provided
  if (!iOSDeviceToken) {
    return NextResponse.json({ message: 'Missing device token' }, { status: 400 });
  }

  // Validate iOS device token
  if (iOSDeviceToken && iOSDeviceToken.length != 64) {
    return NextResponse.json({ message: 'Invalid iOS device token' }, { status: 400 });
  }

  try {
    // Retrieve all alerts
    const data = await redis.lrange(iOSDeviceToken, 0, -1);

    // Delete if alerts exist
    if (data.length != 0) {
      await redis.del(iOSDeviceToken);
    }
    
    return NextResponse.json({
      data: data
    }, { status: 200 });
  } catch (error) {
    console.error('Error retrieving alerts:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
