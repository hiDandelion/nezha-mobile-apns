This is APNs backend for Nezha Mobile.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## Environment Variables
- APNS_KEY_NAME: Name of APNs key. Example: AuthKey_923F4P6MBP.p8
- APNS_KEY_ID: ID of APNs key. Example: 923F4P6MBP
- APNS_TEAM_ID: Team ID of your Apple Developer account. Example: C7AS5D38Q8
- APNS_BUNDLE_ID_IOS: Bundle ID of iOS App. Example: com.argsment.Nezha-Mobile
- APNS_BUNDLE_ID_WATCHOS: Bundle ID of watchOS App. Example: com.argsment.Nezha-Mobile.watchkitapp
- REDIS_URL: Redis URL for rate limiter & temporary alert store. Example: https://liberal-javelin-63060.upstash.io
- REDIS_TOKEN: Redis password for rate limiter & temporary alert store. Example: AfZUAAIjcDE5ZmY4ZDllZTY2ZTI0NjZlYjEwYmYyOWZhYTM0YjljM3AxMA

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
