import { VercelRequest, VercelResponse } from '@vercel/node';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const config = {
  api: {
    bodyParser: true,
  },
};

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  // Disable automatic checksum calculation for React Native compatibility
  requestChecksumCalculation: 'DISABLED',
  responseChecksumValidation: 'DISABLED',
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    // Frontend sends JSON, so parse it directly
    const { fileName, fileType = 'video/mp4', userId } = req.body;

    if (!fileName) return res.status(400).json({ error: "fileName is required" });
    
    const uniqueKey = `shorts/${userId || 'guest'}-${Date.now()}-${fileName.replace(/\s+/g, '_')}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: fileType || 'video/mp4',
      // Explicitly disable checksum to avoid SDK adding extra parameters
      ChecksumAlgorithm: undefined,
    });

    // CRITICAL: For React Native XHR compatibility:
    // 1. Only sign 'content-type' header (NOT 'host' - AWS handles it automatically)
    // 2. Do NOT include 'host' in signableHeaders - this causes signature mismatch
    // 3. The SDK will automatically handle the host header correctly
    const uploadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 900,
      // Only sign content-type, NOT host
      signableHeaders: new Set(['content-type'])
    });

    const fileUrl = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-southeast-2'}.amazonaws.com/${uniqueKey}`;

    return res.status(200).json({ 
      uploadUrl, 
      fileUrl, 
      key: uniqueKey,
      contentType: fileType || 'video/mp4'
    });

  } catch (error: any) {
    console.error("S3 Signer Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
}
