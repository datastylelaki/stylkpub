declare module 'next-pwa' {
    import { NextConfig } from 'next';

    interface PWAConfig {
        dest?: string;
        disable?: boolean;
        register?: boolean;
        skipWaiting?: boolean;
        scope?: string;
        sw?: string;
        runtimeCaching?: unknown[];
        publicExcludes?: string[];
        buildExcludes?: (string | RegExp)[];
        cacheOnFrontEndNav?: boolean;
        reloadOnOnline?: boolean;
        fallbacks?: {
            document?: string;
            image?: string;
            font?: string;
            audio?: string;
            video?: string;
        };
    }

    export default function withPWAInit(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;
}
