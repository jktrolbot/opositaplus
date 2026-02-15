'use client';

import { Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HmsRoomProps {
  roomId: string;
  authToken: string | null;
}

export default function HmsRoom({ roomId, authToken }: HmsRoomProps) {
  const hasAuthToken = Boolean(authToken);

  if (!hasAuthToken) {
    return (
      <Card className="border-slate-700 bg-slate-800">
        <CardContent className="py-10 text-center">
          <Video className="mx-auto h-16 w-16 text-red-400" />
          <p className="mt-4 text-lg font-medium text-white">Error</p>
          <p className="mt-2 text-sm text-red-300">No se pudo obtener el token de autenticación para la sala.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center">
      <Card className="border-slate-700 bg-slate-800">
        <CardContent className="py-10 text-center">
          <Video className="mx-auto h-16 w-16 text-emerald-400" />
          <p className="mt-4 text-lg font-medium text-white">Sala de clase activa</p>
          <p className="mt-2 text-sm text-slate-300">
            Room ID: {roomId}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Cuando @100mslive/roomkit-react esté instalado, la sala interactiva se renderizará aquí.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
