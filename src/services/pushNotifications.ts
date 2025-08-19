// Use the built-in PushSubscription interface from the browser

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications not supported');
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!this.registration) {
      console.log('Service Worker not registered');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.log('Service Worker not registered');
      return null;
    }

    try {
      // Try to subscribe with VAPID key if available, otherwise use basic subscription
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      const subscriptionOptions: PushSubscriptionOptionsInit = {
        userVisibleOnly: true
      };
      
      if (vapidKey) {
        try {
          // Convert VAPID key to proper format
          const vapidKeyArray = this.urlBase64ToUint8Array(vapidKey);
          subscriptionOptions.applicationServerKey = vapidKeyArray as any;
        } catch (error) {
          console.warn('Failed to process VAPID key, using basic subscription:', error);
        }
      }
      
      this.subscription = await this.registration.pushManager.subscribe(subscriptionOptions);

      console.log('Push subscription created:', this.subscription);
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return false;
    }

    try {
      await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('Push subscription removed');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    const subscription = await this.registration.pushManager.getSubscription();
    return subscription !== null;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  getSubscription(): PushSubscription | null {
    return this.subscription;
  }
}

export const pushNotificationService = new PushNotificationService();
