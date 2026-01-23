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
