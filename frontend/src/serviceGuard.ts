import { checkHealth } from './api';

type GuardStatus = 'online' | 'offline' | 'checking';

export class ServiceGuard {
  private status: GuardStatus = 'checking';
  private pollInterval: number = 5000;
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private overlay: HTMLElement | null = null;
  private retryBtn: HTMLElement | null = null;
  private statusText: HTMLElement | null = null;
  private onReconnect: (() => void) | null = null;
  private onDisconnect: (() => void) | null = null;

  constructor(options: {
    onReconnect?: () => void;
    onDisconnect?: () => void;
  }) {
    this.onReconnect = options.onReconnect || null;
    this.onDisconnect = options.onDisconnect || null;
  }

  get isOnline(): boolean {
    return this.status === 'online';
  }

  get isOffline(): boolean {
    return this.status === 'offline';
  }

  async check(): Promise<boolean> {
    const ok = await checkHealth();
    const prev = this.status;
    this.status = ok ? 'online' : 'offline';

    if (prev !== 'offline' && this.status === 'offline') {
      this.onDisconnect?.();
      this.showOverlay();
    } else if (prev === 'offline' && this.status === 'online') {
      this.onReconnect?.();
      this.hideOverlay();
    }

    return ok;
  }

  startPolling(interval: number = 5000): void {
    this.pollInterval = interval;
    this.stopPolling();
    this.pollTimer = setInterval(async () => {
      await this.check();
    }, this.pollInterval);
  }

  stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private showOverlay(): void {
    if (this.overlay) return;

    const overlay = document.createElement('div');
    overlay.className = 'service-guard-overlay';

    const box = document.createElement('div');
    box.className = 'service-guard-box';

    const icon = document.createElement('div');
    icon.className = 'service-guard-icon';
    icon.textContent = '🔌';

    const title = document.createElement('div');
    title.className = 'service-guard-title';
    title.textContent = '后端服务已断开';

    const desc = document.createElement('div');
    desc.className = 'service-guard-desc';
    desc.textContent = '当前游戏画面已保留，重新连接后可继续游戏';

    this.statusText = document.createElement('div');
    this.statusText.className = 'service-guard-status';
    this.statusText.textContent = '正在尝试重新连接...';

    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-primary service-guard-retry-btn';
    retryBtn.textContent = '🔄 立即重试';
    retryBtn.onclick = () => this.handleRetry();
    this.retryBtn = retryBtn;

    box.appendChild(icon);
    box.appendChild(title);
    box.appendChild(desc);
    box.appendChild(this.statusText);
    box.appendChild(retryBtn);
    overlay.appendChild(box);

    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  private hideOverlay(): void {
    if (!this.overlay) return;
    this.overlay.remove();
    this.overlay = null;
    this.retryBtn = null;
    this.statusText = null;
  }

  private async handleRetry(): Promise<void> {
    if (this.retryBtn) {
      this.retryBtn.textContent = '⏳ 检查中...';
      (this.retryBtn as HTMLButtonElement).disabled = true;
    }
    if (this.statusText) {
      this.statusText.textContent = '正在检查后端服务...';
    }

    const ok = await this.check();

    if (!ok) {
      if (this.retryBtn) {
        this.retryBtn.textContent = '🔄 立即重试';
        (this.retryBtn as HTMLButtonElement).disabled = false;
      }
      if (this.statusText) {
        this.statusText.textContent = '重新连接失败，请稍后再试';
      }
    }
  }

  destroy(): void {
    this.stopPolling();
    this.hideOverlay();
  }
}
