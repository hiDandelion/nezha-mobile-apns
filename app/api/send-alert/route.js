import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from "@upstash/ratelimit";
import path from 'path';
import apn from '@parse/node-apn';

const redis = new Redis({
    url: process.env.REDIS_URL,
    token: process.env.REDIS_TOKEN,
})

const rateLimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(10, "60 s")
});

export async function POST(request) {
    const { iOSDeviceToken, watchOSDeviceToken, macOSDeviceToken, title, body, doNotSaveMyAlert } = await request.json();

    // At least one device token is required
    if (!iOSDeviceToken && !watchOSDeviceToken && !macOSDeviceToken) {
        return NextResponse.json({ message: 'Missing device token' }, { status: 400 });
    }

    // Validate iOS device token
    if (iOSDeviceToken && iOSDeviceToken.length != 64) {
        return NextResponse.json({ message: 'Invalid iOS device token' }, { status: 400 });
    }

    // Validate watchOS device token
    if (watchOSDeviceToken && watchOSDeviceToken.length != 64) {
        return NextResponse.json({ message: 'Invalid watchOS device token' }, { status: 400 });
    }

    // Validate macOS device token
    if (macOSDeviceToken && macOSDeviceToken.length != 64) {
        return NextResponse.json({ message: 'Invalid macOS device token' }, { status: 400 });
    }

    // Rate limit alerts to iOS device
    if (iOSDeviceToken) {
        const { success } = await rateLimit.limit(`iOS-${iOSDeviceToken}`);
        if (!success) {
            NextResponse.json({ message: 'Too many requests' }, { status: 429 });
        }
    }

    // Rate limit alerts to watchOS device
    if (watchOSDeviceToken) {
        const { success } = await rateLimit.limit(`watchOS-${watchOSDeviceToken}`);
        if (!success) {
            NextResponse.json({ message: 'Too many requests' }, { status: 429 });
        }
    }

    // Rate limit alerts to macOS device
    if (macOSDeviceToken) {
        const { success } = await rateLimit.limit(`macOS-${macOSDeviceToken}`);
        if (!success) {
            NextResponse.json({ message: 'Too many requests' }, { status: 429 });
        }
    }

    // Alert body is required
    if (!body) {
        return NextResponse.json({ message: 'Missing alert body' }, { status: 400 });
    }

    // Create alert object
    const alert = {
        title: title,
        body: body
    }

    // Get Key Info
    const keyName = process.env.APNS_KEY_NAME;
    const keyPath = path.resolve(process.cwd(), 'private', keyName);
    const keyId = process.env.APNS_KEY_ID;
    const teamId = process.env.APNS_TEAM_ID;

    // Specify APNs connection options
    const options = {
        token: {
            key: keyPath,
            keyId: keyId,
            teamId: teamId,
        },
        production: true
    };

    // Set up APNs provider
    const apnProvider = new apn.Provider(options);

    try {
        // Send to iOS device
        if (iOSDeviceToken) {
            const bundleId = process.env.APNS_BUNDLE_ID_IOS;
            const notification = new apn.Notification();
            notification.pushType = 'alert';
            notification.alert = alert;
            notification.topic = bundleId;

            const result = await apnProvider.send(notification, iOSDeviceToken);
            if (result.failed.length > 0) {
                console.error('Error sending iOS push notification:', result.failed[0].response);
                return NextResponse.json({ message: 'Failed to send iOS push notification' }, { status: 500 });
            }
        }

        // Send to watchOS device
        if (watchOSDeviceToken) {
            const bundleId = process.env.APNS_BUNDLE_ID_WATCHOS;
            const notification = new apn.Notification();
            notification.pushType = 'alert';
            notification.alert = alert;
            notification.topic = bundleId;

            const result = await apnProvider.send(notification, watchOSDeviceToken);
            if (result.failed.length > 0) {
                console.error('Error sending watchOS push notification:', result.failed[0].response);
                return NextResponse.json({ message: 'Failed to send watchOS push notification' }, { status: 500 });
            }
        }

        // Send to macOS device
        if (macOSDeviceToken) {
            const bundleId = process.env.APNS_BUNDLE_ID_IOS;
            const notification = new apn.Notification();
            notification.pushType = 'alert';
            notification.alert = alert;
            notification.topic = bundleId;

            const result = await apnProvider.send(notification, macOSDeviceToken);
            if (result.failed.length > 0) {
                console.error('Error sending macOS push notification:', result.failed[0].response);
                return NextResponse.json({ message: 'Failed to send macOS push notification' }, { status: 500 });
            }
        }

        // Shutdown APNs provider
        apnProvider.shutdown();

        // Save alert object for retrieval
        if (!doNotSaveMyAlert) {
            const alertToSave = {
                ...alert,
                timestamp: new Date().getTime()
            }
            // Currently you can only retrive iOS messages from iOS App
            if (iOSDeviceToken) {
                await redis.rpush(iOSDeviceToken, alertToSave);
            }
        }

        return NextResponse.json({ message: 'Success' }, { status: 200 });
    } catch (error) {
        console.error('Error sending and saving push notification:', error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}
