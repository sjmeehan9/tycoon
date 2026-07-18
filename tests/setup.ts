import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

const context = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  drawImage: vi.fn(),
  imageSmoothingEnabled: false,
  fillStyle: '',
  font: '',
};

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  configurable: true,
  value: vi.fn(() => context),
});

Object.defineProperty(window, 'requestAnimationFrame', {
  configurable: true,
  value: vi.fn(() => 1),
});

Object.defineProperty(window, 'cancelAnimationFrame', {
  configurable: true,
  value: vi.fn(),
});
