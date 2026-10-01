import { Injectable } from '@angular/core';

const DEVICE_KEY = 'kana-study.device-id.v1';

@Injectable({ providedIn: 'root' })
export class DeviceService {
  readonly id = loadDeviceId();
}

function loadDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_KEY);
    if (existing) return existing;
    const id = globalThis.crypto?.randomUUID?.() ?? `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(DEVICE_KEY, id);
    return id;
  } catch { return `ephemeral-${Math.random().toString(36).slice(2)}`; }
}
