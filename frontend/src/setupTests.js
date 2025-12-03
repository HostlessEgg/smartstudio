import '@testing-library/jest-dom';
// jsdom doesn't implement canvas; provide a minimal stub for axe-core
try {
	// override unconditionally to avoid "Not implemented" errors
	HTMLCanvasElement.prototype.getContext = function () { return {} };
} catch (e) {
	// ignore environments without DOM
}
// stub window.alert used by some components
try { window.alert = window.alert || function(){} } catch (e) {}
