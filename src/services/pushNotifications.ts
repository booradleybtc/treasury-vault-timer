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
      // For now, skip VAPID key to avoid type issues
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true
      });

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

  // Removed unused urlBase64ToUint8Array method

  getSubscription(): PushSubscription | null {
    return this.subscription;
  }
}

export const pushNotificationService = new PushNotificationService();
