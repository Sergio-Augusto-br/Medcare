export interface BrowserNotificationMessage {
  id: string;
  title: string;
  body: string;
  path: string;
}

export interface BrowserNotificationPort {
  isSupported(): boolean;
  permission(): NotificationPermission | "unsupported";
  requestPermission(): Promise<NotificationPermission>;
  showOnce(message: BrowserNotificationMessage): boolean;
  release(messageId: string): void;
  showConfirmation(): void;
}

type NavigationWindow = Pick<Window, "focus" | "location">;

export class BrowserNotificationAdapter implements BrowserNotificationPort {
  constructor(
    private readonly notificationApi: typeof Notification | undefined = globalThis.Notification,
    private readonly storage: Storage = localStorage,
    private readonly browserWindow: NavigationWindow = window,
  ) {}

  isSupported() {
    return Boolean(this.notificationApi);
  }

  permission() {
    return this.notificationApi?.permission ?? "unsupported";
  }

  requestPermission() {
    if (!this.notificationApi) return Promise.resolve("denied" as NotificationPermission);
    return this.notificationApi.requestPermission();
  }

  showOnce(message: BrowserNotificationMessage) {
    if (!this.notificationApi || this.permission() !== "granted") return false;
    const storageKey = this.storageKey(message.id);
    if (this.storage.getItem(storageKey)) return false;

    const notification = new this.notificationApi(message.title, {
      body: message.body,
      icon: "/medcare-icon.svg",
      tag: message.id,
    });
    notification.onclick = () => {
      this.browserWindow.focus();
      this.browserWindow.location.assign(message.path);
    };
    this.storage.setItem(storageKey, new Date().toISOString());
    return true;
  }

  release(messageId: string) {
    this.storage.removeItem(this.storageKey(messageId));
  }

  showConfirmation() {
    if (!this.notificationApi || this.permission() !== "granted") return;
    new this.notificationApi("MedCare", {
      body: "Avisos ativados neste navegador.",
      icon: "/medcare-icon.svg",
    });
  }

  private storageKey(messageId: string) {
    return `medcare.browserNotification.${messageId}`;
  }
}

export const browserNotificationAdapter = new BrowserNotificationAdapter();
