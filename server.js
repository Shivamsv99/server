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

// Check for API keys
if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('FATAL: LiveKit API Key or Secret is missing. Check your .env file.');
  process.exit(1);
}

app.post('/token', async (req, res) => {
  try {
    const { roomName, participantName } = req.body;

    if (!roomName?.trim() || !participantName?.trim()) {
      return res.status(400).json({ error: 'Valid roomName and participantName are required' });
    }

    console.log('--- Creating Token ---');
    console.log(`Room: ${roomName}, Participant: ${participantName}`);

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

    const token = await at.toJwt();

    if (!token || typeof token !== 'string') {
      throw new Error('Generated token is invalid');
    }

    res.json({
      token,
      wsUrl: LIVEKIT_URL,
      room: roomName.trim(),
      participant: participantName.trim(),
    });

  } catch (error) {
    console.error('Error generating token:', error.message);
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
