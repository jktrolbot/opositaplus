'use server';

import { createClient } from '@/lib/supabase/server';
import jwt from 'jsonwebtoken';

const HMS_ACCESS_KEY = process.env.HMS_ACCESS_KEY ?? '';
const HMS_SECRET = process.env.HMS_SECRET ?? '';

export async function createRoom(title: string) {
  const response = await fetch('https://api.100ms.live/v2/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${await getManagementToken()}`,
    },
    body: JSON.stringify({
      name: title.toLowerCase().replace(/\s+/g, '-'),
      description: title,
      template_id: process.env.NEXT_PUBLIC_100MS_TEMPLATE_ID,
    }),
  });

  if (!response.ok) throw new Error('Failed to create room');
  return response.json();
}

export async function generateAuthToken(roomId: string, userId: string, role: string) {
  const payload = {
    access_key: HMS_ACCESS_KEY,
    room_id: roomId,
    user_id: userId,
    role,
    type: 'app',
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
  };

  if (!HMS_SECRET) return null;

  const token = jwt.sign(payload, HMS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
    jwtid: crypto.randomUUID(),
  });

  return token;
}

async function getManagementToken() {
  const payload = {
    access_key: HMS_ACCESS_KEY,
    type: 'management',
    version: 2,
    iat: Math.floor(Date.now() / 1000),
    nbf: Math.floor(Date.now() / 1000),
  };

  if (!HMS_SECRET) return '';

  return jwt.sign(payload, HMS_SECRET, {
    algorithm: 'HS256',
    expiresIn: '24h',
    jwtid: crypto.randomUUID(),
  });
}

export async function createClass(data: {
  organization_id: string;
  opposition_id: string;
  title: string;
  description?: string;
  type: string;
  starts_at: string;
  ends_at?: string;
  teacher_id: string;
}) {
  const supabase = await createClient();

  // Create 100ms room
  let meetingId: string | null = null;
  let meetingUrl: string | null = null;
  try {
    const room = await createRoom(data.title);
    meetingId = room.id;
    meetingUrl = `https://app.100ms.live/meeting/${room.id}`;
  } catch {
    // 100ms not configured, proceed without meeting
  }

  const { data: cls, error } = await supabase
    .from('classes')
    .insert({
      ...data,
      meeting_provider: '100ms',
      meeting_id: meetingId,
      meeting_url: meetingUrl,
      status: 'scheduled',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return cls;
}
