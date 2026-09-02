/**
 * مدیریت اتصال WebSocket به بک‌اند.
 * فرمت پیام خروجی (به سرور): { action: "...", data: {...} }
 * فرمت پیام ورودی (از سرور): { event: "...", data: {...} }
 */

const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

export class GameConnection {
  constructor() {
    this.socket = null;
    this.listeners = new Map(); // event name -> Set of callback functions
  }

  connect(roomCode, userId) {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE_URL}/${roomCode}/${userId}`;
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        console.log("به سرور وصل شد ✅");
        resolve();
      };

      this.socket.onerror = (err) => {
        console.error("خطای اتصال WebSocket:", err);
        reject(err);
      };

      this.socket.onclose = () => {
        console.log("اتصال قطع شد");
        this._emit("connection_closed", {});
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this._emit(message.event, message.data);
        } catch (e) {
          console.error("خطا در پردازش پیام سرور:", e);
        }
      };
    });
  }

  send(action, data = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, data }));
    } else {
      console.warn("اتصال برقرار نیست، پیام ارسال نشد:", action);
    }
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);

    // برگردوندن تابع unsubscribe برای راحتی پاک‌سازی در useEffect
    return () => this.listeners.get(eventName)?.delete(callback);
  }

  _emit(eventName, data) {
    this.listeners.get(eventName)?.forEach((cb) => cb(data));
  }

  disconnect() {
    this.socket?.close();
    this.socket = null;
  }
}

// یک نمونه‌ی سراسری که کل اپ ازش استفاده می‌کنه
export const gameConnection = new GameConnection();