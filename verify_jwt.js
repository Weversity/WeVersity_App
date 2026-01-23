const crypto = require('crypto');

function base64url(str) {
    return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function verify(token, secret) {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    const message = `${headerB64}.${payloadB64}`;
    const genSignature = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('base64');

    const expectedSignature = base64url(genSignature);

    if (expectedSignature === signatureB64) {
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
        console.log("Payload:", JSON.stringify(payload, null, 2));
        return "Signature matches!";
    } else {
        return `Signature MISMATCH! Expected: ${expectedSignature}, Got: ${signatureB64}`;
    }
}

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGEyODRlNi03MDU2LTQxMjYtOTM5Yy0wOGIxYjVkMzgxNDEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDg0MzM1NTQ5LCJpYXQiOjE3Njg5NzU1NDksImVtYWlsIjoic2FtZWVyd2ViZGV2ZWxvcGVyNDFAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhcHByb3ZlZCI6dHJ1ZSwiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tEZXdHWGdZRFBxRVdGZGpCc3dMQ3hsUUd4N243QXZZdV9NZGZ5QlRZZGFfMVFZdz1zOTYtYyIsImVtYWlsIjoic2FtZWVyd2ViZGV2ZWxvcGVyNDFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcnN0X25hbWUiOiJzYW1lZXIiLCJmdWxsX25hbWUiOiJTYW1lZXIgV2ViIERldmVsb3BlciIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsImxhc3RfbmFtZSI6InNhamlkIiwibmFtZSI6IlNhbWVlciBXZWIgRGV2ZWxvcGVyIiwicGhvbmVfbnVtYmVyIjoiKzkyMzIzNjYwODAzMSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tEZXdHWGdZRFBxRVdGZGpCc3dMQ3hsUUd4N243QXZZdV9NZGZ5QlRZZGFfMVFZdz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTAyOTI4MTk5MjU1OTM5MDMwMTExIiwicm9sZSI6Imluc3RydWN0b3IiLCJzdWIiOiIxMDI5MjgxOTkyNTU5MzkwMzAxMTEiLCJ1c2VybmFtZSI6IlNhbWVlclNhamlkIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3Njg5NzU1NDl9XSwic2Vzc2lvbl9pZCI6IjM4YTBiMGFiLTE2NWUtNDU1Ni1hODM2LTlmMTk5NGI2YTc3OSIsImlzX2Fub255bW91cyI6ZmFsc2V9.IkYp7xUM_TsWbo9GIQe0HCCIKrEcRG6A5Pogu3nPpF0";
const secret = "your-super-secret-jwt-token-with-at-least-32-characters-long";

console.log(verify(token, secret));
