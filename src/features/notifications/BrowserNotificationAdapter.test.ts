import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserNotificationAdapter } from "./BrowserNotificationAdapter";

function notificationApi(created: { title: string; notification: FakeNotification }[]) {
  return class FakeNotificationConstructor {
    static permission: NotificationPermission = "granted";
    static requestPermission = vi.fn(async () => "granted" as NotificationPermission);
    onclick: ((this: Notification, event: Event) => unknown) | null = null;

    constructor(title: string) {
      created.push({ title, notification: this as unknown as FakeNotification });
    }
  } as unknown as typeof Notification;
}

interface FakeNotification {
  onclick: (() => void) | null;
}

describe("BrowserNotificationAdapter", () => {
  beforeEach(() => localStorage.clear());

  it("adapta a mensagem, preserva o clique e evita repetição", () => {
    const created: { title: string; notification: FakeNotification }[] = [];
    const focus = vi.fn();
    const assign = vi.fn();
    const adapter = new BrowserNotificationAdapter(notificationApi(created), localStorage, {
      focus,
      location: { assign } as unknown as Location,
    });
    const message = {
      id: "notification-1",
      title: "Hora do medicamento",
      body: "Medicamento teste",
      path: "/app/doses/dose-1",
    };

    expect(adapter.showOnce(message)).toBe(true);
    expect(adapter.showOnce(message)).toBe(false);
    expect(created).toHaveLength(1);
    created[0]?.notification.onclick?.();
    expect(focus).toHaveBeenCalledOnce();
    expect(assign).toHaveBeenCalledWith("/app/doses/dose-1");
  });

  it("permite um novo aviso depois que o lembrete é adiado", () => {
    const created: { title: string; notification: FakeNotification }[] = [];
    const adapter = new BrowserNotificationAdapter(notificationApi(created), localStorage, {
      focus: vi.fn(),
      location: { assign: vi.fn() } as unknown as Location,
    });
    const base = {
      id: "notification-snoozed",
      title: "Hora do medicamento",
      body: "Medicamento teste",
      path: "/app/doses/dose-1",
    };

    expect(adapter.showOnce(base)).toBe(true);
    expect(adapter.showOnce(base)).toBe(false);
    adapter.release(base.id);
    expect(adapter.showOnce(base)).toBe(true);
    expect(created).toHaveLength(2);
  });
});
