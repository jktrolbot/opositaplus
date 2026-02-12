import { NextResponse } from 'next/server';
import { addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { getOposicionBySlug } from '@/data/oposiciones';

export async function POST(request: Request) {
  try {
    const { examDate, hoursPerDay, oposicion } = await request.json();

    if (!examDate || !hoursPerDay) {
      return NextResponse.json({ error: 'Faltan datos para generar el plan' }, { status: 400 });
    }

    const oposicionData =
      typeof oposicion === 'string' && oposicion.length > 0
        ? getOposicionBySlug(oposicion)
        : undefined;

    const planTopics = oposicionData?.topics.map((topic) => topic.name) ?? [];

    if (planTopics.length === 0) {
      return NextResponse.json({ error: 'No hay temario para generar el plan' }, { status: 400 });
    }

    const start = startOfWeek(new Date(), { locale: es });
    const exam = new Date(examDate);
    const days = Math.floor((exam.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.max(1, Math.ceil(days / 7));

    const weeksData = [];
    let currentDate = start;
    let topicIndex = 0;

    for (let week = 0; week < weeks && week < 16; week += 1) {
      const daysData = [];

      for (let day = 0; day < 7; day += 1) {
        const dayTopics = [planTopics[topicIndex % planTopics.length]];
        if (hoursPerDay >= 3) {
          dayTopics.push(planTopics[(topicIndex + 1) % planTopics.length]);
        }
        if (hoursPerDay >= 5) {
          dayTopics.push(planTopics[(topicIndex + 2) % planTopics.length]);
        }

        daysData.push({
          date: currentDate.toISOString().split('T')[0],
          topics: dayTopics,
          completed: false,
        });

        currentDate = addDays(currentDate, 1);
        if ((day + 1) % 2 === 0) topicIndex += 1;
      }

      weeksData.push({ week: week + 1, days: daysData });
    }

    return NextResponse.json({
      oposicion,
      examDate,
      hoursPerDay,
      topics: planTopics,
      weeks: weeksData,
    });
  } catch (error) {
    console.error('Generate plan error:', error);
    return NextResponse.json({ error: 'No se pudo generar el plan' }, { status: 500 });
  }
}
