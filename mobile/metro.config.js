const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// This file sets up the Metro bundler to resolve workspace dependencies.
// It also watches the root package for changes and rebuilds the app automatically.

const workspaceRoot = path.resolve(__dirname, '..');

config.watchFolders = [workspaceRoot];

// Resolve deps from this app first, then root's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// Keep co-located test files out of the app bundle. Without this, expo-router's
// require.context picks up `app/**/*.test.tsx`, which pulls in test-only deps
// (e.g. @testing-library/react-native -> Node's "console") that don't exist in RN.
config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList)
    ? config.resolver.blockList
    : [config.resolver.blockList].filter(Boolean)),
  /.*\.test\.[jt]sx?$/,
  /.*\.spec\.[jt]sx?$/,
];

module.exports = config;
