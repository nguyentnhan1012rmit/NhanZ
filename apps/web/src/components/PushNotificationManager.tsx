import { useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { api } from '@/lib/api';

const VAPID_PUBLIC_KEY = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export function PushNotificationManager() {
    const { isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && 'serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    return registration.pushManager.getSubscription()
                        .then(async subscription => {
                            if (subscription) {
                                return subscription;
                            }
                            
                            if (Notification.permission !== 'granted') {
                                const permission = await Notification.requestPermission();
                                if (permission !== 'granted') return null;
                            }

                            if (!VAPID_PUBLIC_KEY) return null;

                            const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
                            return registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: convertedVapidKey
                            });
                        });
                })
                .then(subscription => {
                    if (subscription) {
                        api.post('/api/subscribe', subscription).catch(console.error);
                    }
                })
                .catch(console.error);
        }
    }, [isAuthenticated]);

    return null;
}
