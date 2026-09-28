import { Injectable, signal } from '@angular/core';

export type Toast = { id: number; text: string; kind: 'info' | 'error' };

@Injectable({ providedIn: 'root' })
export class Toasts {
  readonly list = signal<Toast[]>([]);
  private next = 0;

  show(text: string, kind: Toast['kind'] = 'info') {
    const id = ++this.next;
    this.list.update((l) => [...l, { id, text, kind }]);
    setTimeout(() => this.dismiss(id), 4000);
  }

  error(err: unknown) {
    this.show(err instanceof Error ? err.message : String(err), 'error');
  }

  dismiss(id: number) {
    this.list.update((l) => l.filter((t) => t.id !== id));
  }
}
