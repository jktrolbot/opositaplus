import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { tasks } from '@trigger.dev/sdk/v3';
import type { processRecording } from '@/trigger/process-recording';

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();

  const { type, data } = body;

  switch (type) {
    case 'recording.success': {
      const roomId = data?.room_id;
      const recordingUrl = data?.recording_presigned_url;

      if (roomId && recordingUrl) {
        // Update class with recording URL
        const { data: cls } = await supabase
          .from('classes')
          .update({ recording_url: recordingUrl, status: 'completed' })
          .eq('meeting_id', roomId)
          .select('id, organization_id, opposition_id')
          .single();

        // Trigger auto-question generation from recording
        if (cls) {
          await tasks.trigger<typeof processRecording>('process-recording', {
            classId: cls.id,
            recordingUrl,
            organizationId: cls.organization_id,
            oppositionId: cls.opposition_id,
          });
        }
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
