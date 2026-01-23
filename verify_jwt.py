import hmac
import hashlib
import base64

def check_jwt(token, secret):
    try:
        header_b64, payload_b64, signature_b64 = token.split('.')
        
        # Re-encode header and payload to verify signature
        message = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        # Sign with secret
        secret_bytes = secret.encode('utf-8')
        signature = hmac.new(secret_bytes, message, hashlib.sha256).digest()
        
        # Encode signature to base64url
        expected_signature_b64 = base64.urlsafe_b64encode(signature).decode('utf-8').replace('=', '')
        
        if expected_signature_b64 == signature_b64:
            return True, "Signature matches!"
        else:
            return False, f"Signature MISMATCH! Expected: {expected_signature_b64}, Got: {signature_b64}"
    except Exception as e:
        return False, str(e)

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5ZGEyODRlNi03MDU2LTQxMjYtOTM5Yy0wOGIxYjVkMzgxNDEiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDg0MzM1NTQ5LCJpYXQiOjE3Njg5NzU1NDksImVtYWlsIjoic2FtZWVyd2ViZGV2ZWxvcGVyNDFAZ21haWwuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCIsImdvb2dsZSJdfSwidXNlcl9tZXRhZGF0YSI6eyJhcHByb3ZlZCI6dHJ1ZSwiYXZhdGFyX3VybCI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tEZXdHWGdZRFBxRVdGZGpCc3dMQ3hsUUd4N243QXZZdV9NZGZ5QlRZZGFfMVFZdz1zOTYtYyIsImVtYWlsIjoic2FtZWVyd2ViZGV2ZWxvcGVyNDFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcnN0X25hbWUiOiJzYW1lZXIiLCJmdWxsX25hbWUiOiJTYW1lZXIgV2ViIERldmVsb3BlciIsImlzcyI6Imh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbSIsImxhc3RfbmFtZSI6InNhamlkIiwibmFtZSI6IlNhbWVlciBXZWIgRGV2ZWxvcGVyIiwicGhvbmVfbnVtYmVyIjoiKzkyMzIzNjYwODAzMSIsInBob25lX3ZlcmlmaWVkIjpmYWxzZSwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0tEZXdHWGdZRFBxRVdGZGpCc3dMQ3hsUUd4N243QXZZdV9NZGZ5QlRZZGFfMVFZdz1zOTYtYyIsInByb3ZpZGVyX2lkIjoiMTAyOTI4MTk5MjU1OTM5MDMwMTExIiwicm9sZSI6Imluc3RydWN0b3IiLCJzdWIiOiIxMDI5MjgxOTkyNTU5MzkwMzAxMTEiLCJ1c2VybmFtZSI6IlNhbWVlclNhamlkIn0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3Njg5NzU1NDl9XSwic2Vzc2lvbl9pZCI6IjM4YTBiMGFiLTE2NWUtNDU1Ni1hODM2LTlmMTk5NGI2YTc3OSIsImlzX2Fub255bW91cyI6ZmFsc2V9.IkYp7xUM_TsWbo9GIQe0HCCIKrEcRG6A5Pogu3nPpF0"
secret = "your-super-secret-jwt-token-with-at-least-32-characters-long"

print(check_jwt(token, secret))
