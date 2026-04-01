import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';

// Force global assignments
global.Buffer = global.Buffer || Buffer;

if (typeof process === 'undefined') {
    global.process = require('process');
} else {
    global.process.env = global.process.env || {};
}

console.log("Polyfills loaded successfully");

// Robust fallback for nanoid (used by React Navigation and other libs)
// This prevents "(0, require(...).nanoid) is not a function" crashes.
if (typeof global.nanoid !== 'function') {
    global.nanoid = (size = 21) => {
        const alphabet = 'useand-24678301596tyfolp_qxzibvkwjhmsgcjr749';
        let id = '';
        while (size--) {
            id += alphabet[(Math.random() * alphabet.length) | 0];
        }
        return id;
    };
}
