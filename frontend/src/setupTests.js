import '@testing-library/jest-dom';
import { vi } from 'vitest';
// jsdom doesn't implement canvas; provide a minimal stub for axe-core
try {
	// override unconditionally to avoid "Not implemented" errors
	HTMLCanvasElement.prototype.getContext = function () { return {} };
} catch (e) {
	// ignore environments without DOM
}
// stub window.alert used by some components
// Ensure `alert` exists on the global object without triggering jsdom accessors
if (typeof globalThis !== 'undefined') {
	try {
		Object.defineProperty(globalThis, 'alert', {
			value: () => {},
			writable: true,
			configurable: true,
			enumerable: false,
		});
	} catch (e) {
		try { globalThis.alert = () => {}; } catch (e) { /* ignore */ }
	}
}

// Mock toast context for tests that render pages directly
vi.mock('./contexts/ToastContext', () => ({
	__esModule: true,
	useToast: () => ({ addToast: () => {}, removeToast: () => {}, toasts: [] }),
	ToastProvider: ({ children }) => children,
	default: {},
}));
