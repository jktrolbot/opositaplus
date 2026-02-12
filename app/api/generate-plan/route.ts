import { NextResponse } from 'next/server';
import { addDays, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

export async function POST(request: Request) {
  try {
    const { examDate, hoursPerDay, topics } = await request.json();

    const start = startOfWeek(new Date(), { locale: es });
    const exam = new Date(examDate);
    const days = Math.floor((exam.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const weeks = Math.ceil(days / 7);

    const weeksData = [];
    let currentDate = start;
    let topicIndex = 0;

    for (let w = 0; w < weeks && w < 12; w++) {
      const daysData = [];
      for (let d = 0; d < 7; d++) {
        // Distribute topics based on hours per day
        const dayTopics = [topics[topicIndex % topics.length]];
        if (hoursPerDay >= 3) {
          dayTopics.push(topics[(topicIndex + 1) % topics.length]);
        }
        if (hoursPerDay >= 5) {
          dayTopics.push(topics[(topicIndex + 2) % topics.length]);
        }
        
        daysData.push({
          date: currentDate.toISOString().split('T')[0],
          topics: dayTopics,
          completed: false,
        });
        
        currentDate = addDays(currentDate, 1);
        if ((d + 1) % 2 === 0) topicIndex++;
      }
      
      weeksData.push({ week: w + 1, days: daysData });
    }

    return NextResponse.json({
      examDate,
      hoursPerDay,
      topics,
      weeks: weeksData,
    });
  } catch (error) {
    console.error('Generate plan error:', error);
    return NextResponse.json(
      { error: 'Failed to generate plan' },
      { status: 500 }
    );
  }
}
