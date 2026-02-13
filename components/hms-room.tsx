'use client';

import { useEffect, useState } from 'react';
import { Loader2, Video } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface HmsRoomProps {
  roomId: string;
  authToken: string | null;
}

export default function HmsRoom({ roomId, authToken }: HmsRoomProps) {
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!authToken) {
      setError('No se pudo obtener el token de autenticación para la sala.');
      return;
    }
    // Mark as loaded — in production, you'd initialize the HMS SDK here
    setLoaded(true);
  }, [authToken]);

  if (error) {
    return (
      <Card className="border-slate-700 bg-slate-800">
        <CardContent className="py-10 text-center">
          <Video className="mx-auto h-16 w-16 text-red-400" />
          <p className="mt-4 text-lg font-medium text-white">Error</p>
          <p className="mt-2 text-sm text-red-300">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <span className="ml-2 text-white">Conectando a la sala...</span>
      </div>
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
