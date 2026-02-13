import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();

  const { type, data } = body;

  switch (type) {
    case 'recording.success': {
      const roomId = data?.room_id;
      const recordingUrl = data?.recording_presigned_url;

      if (roomId && recordingUrl) {
        await supabase
          .from('classes')
          .update({ recording_url: recordingUrl, status: 'completed' })
          .eq('meeting_id', roomId);
      }
      break;
    }

    case 'session.close.success': {
      const roomId = data?.room_id;
      if (roomId) {
        await supabase
          .from('classes')
          .update({ status: 'completed' })
          .eq('meeting_id', roomId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
