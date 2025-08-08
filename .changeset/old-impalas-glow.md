---
"studiocms": patch
---

Optimize user-quick-tools widget
- **Performance**: Implemented O(1) permission checking with Set-based hierarchy, deferred initialization strategies (idle/interaction/immediate), and non-blocking rendering using requestIdleCallback/requestAnimationFrame
- **UX Improvements**: Added click protection to prevent accidental interactions, visual shake feedback for ignored clicks, smooth animations with configurable delays, and dynamic theme switching support
- **Configurability**: Component now supports data attributes for initialization strategy, timing parameters, and protection durations
- **Robustness**: Enhanced error handling with 5-second timeout for session fetching, graceful failures without blocking page rendering, and proper cleanup on unmount
- **Code Quality**: Modularized component structure with clear separation of concerns, extracted styles into constants, and improved TypeScript typing