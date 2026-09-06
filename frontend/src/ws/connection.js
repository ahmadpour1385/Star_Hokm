const WS_BASE_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";

export class GameConnection {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this._intentional = false;
  }

  connect(roomCode, userId) {
    return new Promise((resolve, reject) => {
      const url = `${WS_BASE_URL}/${roomCode}/${userId}`;
      this.socket = new WebSocket(url);
      this._intentional = false;

      this.socket.onopen = () => resolve();

      this.socket.onerror = (err) => reject(err);

      this.socket.onclose = () => {
        const wasIntentional = this._intentional;
        this._intentional = false;
        if (!wasIntentional) {
          this._emit("connection_closed", {});
        }
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
    }
  }

  on(eventName, callback) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, new Set());
    }
    this.listeners.get(eventName).add(callback);
    return () => this.listeners.get(eventName)?.delete(callback);
  }

  _emit(eventName, data) {
    this.listeners.get(eventName)?.forEach((cb) => cb(data));
  }

  disconnect() {
    this._intentional = true;
    this.socket?.close();
    this.socket = null;
  }
}

  isConnected() {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

export const gameConnection = new GameConnection();