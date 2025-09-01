import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

// Initial check
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('FATAL: LiveKit API Key or Secret is missing. Check your .env file.');
  process.exit(1);
}

// Make the route handler async
app.post('/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!roomName?.trim() || !participantName?.trim()) {
      return res.status(400).json({ error: 'Valid roomName and participantName are required' });
    }

    // --- Start Debug Logging ---
    console.log('--- Creating Token ---');
    console.log(`Room: ${roomName}, Participant: ${participantName}`);
    console.log(`API Key Loaded: ${!!LIVEKIT_API_KEY}, Length: ${LIVEKIT_API_KEY?.length}`);
    console.log(`API Secret Loaded: ${!!LIVEKIT_API_SECRET}, Length: ${LIVEKIT_API_SECRET?.length}`);
    // --- End Debug Logging ---

    const at = new AccessToken(
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      {
        identity: participantName.trim(),
        ttl: '10m',
      }
    );

    at.addGrant({
      room: roomName.trim(),
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
    });

    // Await the promise to get the actual token string
    const token = await at.toJwt();

    // Check the output of toJwt()
    if (!token || typeof token !== 'string' || token.length === 0) {
      console.error('toJwt() produced an invalid value:', token);
      throw new Error('Generated token is not a valid string.');
    }

    console.log(`Token generated successfully. Length: ${token.length}`);

    res.json({
      token: token,
      wsUrl: LIVEKIT_URL,
    });

  } catch (error) {
    console.error('A critical error occurred during token generation:', error.message);
    res.status(500).json({
      error: 'Could not generate token.',
      details: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});