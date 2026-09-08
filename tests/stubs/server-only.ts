// Vitest runs service code outside of Next.js's RSC bundler, where the real
// `server-only` package would throw unconditionally. This stub keeps the
// import safe for tests while the real package still guards against
// accidental client-component usage in the actual Next.js build.
export {};
