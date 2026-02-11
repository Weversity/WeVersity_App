const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// 1. AWS SDK aur dusri libraries ke liye cjs support
config.resolver.assetExts.push('cjs');

// 2. Memory Crash (Out of Memory) se bachne ke liye Workers limit
// Isse Metro ek sath bohot zyada processes nahi chalayega
config.maxWorkers = 2;

// 3. (Optional) Agar bundle size bada hai to transform options
config.transformer = {
    ...config.transformer,
    getTransformOptions: async () => ({
        transform: {
            experimentalImportSupport: false,
            inlineRequires: true, // Isse performance behtar hoti hai
        },
    }),
};

module.exports = config;