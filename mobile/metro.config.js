const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// This file sets up the Metro bundler to resolve workspace dependencies.
// It also watches the root package for changes and rebuilds the app automatically.

const workspaceRoot = path.resolve(__dirname, "..");

config.watchFolders = [workspaceRoot];

// Resolve deps from this app first, then root's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// Avoid Metro walking up the directory tree in monorepo setups.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
