import { NextResponse } from 'next/server';
import { Client } from 'pg';

export const dynamic = 'force-dynamic';

const DB_URL = process.env.SUPABASE_DB_URL
  ?? 'postgresql://postgres.bardmyaujaxmttxcczxi:13vOnqHbvzPqrZ0H@aws-1-eu-west-1.pooler.supabase.com:5432/postgres';

async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tema = searchParams.get('tema');
    const type = searchParams.get('type') ?? 'overview';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);
    const offset = (page - 1) * limit;

    return await withDb(async (db) => {
      // Get opposition
      const opoRes = await db.query(
        `SELECT id, name FROM oppositions WHERE slug = 'tecnico-hacienda-dt' LIMIT 1`
      );
      if (opoRes.rows.length === 0) {
        return NextResponse.json({ error: 'Oposición no encontrada' }, { status: 404 });
      }
      const opo = opoRes.rows[0];

      if (type === 'overview') {
        const [temaStats, chunkCount, qCount, fcCount, uploads] = await Promise.all([
          db.query(
            `SELECT tema, count(*)::int as count FROM knowledge_chunks WHERE oposicion_id = $1 AND tema IS NOT NULL GROUP BY tema ORDER BY tema`,
            [opo.id]
          ),
          db.query(`SELECT count(*)::int as c FROM knowledge_chunks WHERE oposicion_id = $1`, [opo.id]),
          db.query(`SELECT count(*)::int as c FROM generated_questions WHERE oposicion_id = $1`, [opo.id]),
          db.query(`SELECT count(*)::int as c FROM flashcards WHERE oposicion_id = $1`, [opo.id]),
          db.query(
            `SELECT id, file_name, file_type, status, metadata, created_at FROM content_uploads WHERE oposicion_id = $1 ORDER BY file_name`,
            [opo.id]
          ),
        ]);

        // Sort temas numerically
        const sortedTemas = temaStats.rows.sort((a: { tema: string }, b: { tema: string }) => {
          const numA = parseInt(a.tema.replace('Tema ', ''), 10) || 999;
          const numB = parseInt(b.tema.replace('Tema ', ''), 10) || 999;
          return numA - numB;
        });

        return NextResponse.json({
          oposicion: opo,
          stats: {
            chunks: chunkCount.rows[0].c,
            questions: qCount.rows[0].c,
            flashcards: fcCount.rows[0].c,
            uploads: uploads.rows.length,
            temas: sortedTemas,
          },
          uploads: uploads.rows,
        });
      }

      if (type === 'chunks') {
        const params: (string | number)[] = [opo.id];
        let where = 'WHERE kc.oposicion_id = $1';
        if (tema) {
          params.push(tema);
          where += ` AND kc.tema = $2`;
        }
        params.push(limit, offset);
        const pLimit = params.length - 1;
        const pOffset = params.length;

        const res = await db.query(
          `SELECT kc.id, kc.tema, kc.chunk_text, kc.tags, kc.source_ref, kc.created_at
           FROM knowledge_chunks kc
           ${where}
           ORDER BY kc.tema, kc.source_ref
           LIMIT $${pLimit} OFFSET $${pOffset}`,
          params
        );

        return NextResponse.json({ data: res.rows, page, limit });
      }

      if (type === 'questions') {
        const params: (string | number)[] = [opo.id];
        let where = 'WHERE gq.oposicion_id = $1';
        if (tema) {
          params.push(tema);
          where += ` AND kc.tema = $2`;
        }
        params.push(limit, offset);
        const pLimit = params.length - 1;
        const pOffset = params.length;

        const res = await db.query(
          `SELECT gq.id, gq.question_text, gq.options, gq.correct_answer, gq.explanation,
                  gq.difficulty, gq.metadata,
                  json_build_object('tema', kc.tema, 'source_ref', kc.source_ref, 'tags', kc.tags) as knowledge_chunks
           FROM generated_questions gq
           LEFT JOIN knowledge_chunks kc ON kc.id = gq.chunk_id
           ${where}
           ORDER BY kc.tema, gq.id
           LIMIT $${pLimit} OFFSET $${pOffset}`,
          params
        );

        return NextResponse.json({ data: res.rows, page, limit });
      }

      if (type === 'flashcards') {
        const params: (string | number)[] = [opo.id];
        let where = 'WHERE fc.oposicion_id = $1';
        if (tema) {
          params.push(tema);
          where += ` AND kc.tema = $2`;
        }
        params.push(limit, offset);
        const pLimit = params.length - 1;
        const pOffset = params.length;

        const res = await db.query(
          `SELECT fc.id, fc.front, fc.back, fc.tags, fc.difficulty, fc.metadata,
                  json_build_object('tema', kc.tema, 'source_ref', kc.source_ref, 'tags', kc.tags) as knowledge_chunks
           FROM flashcards fc
           LEFT JOIN knowledge_chunks kc ON kc.id = fc.chunk_id
           ${where}
           ORDER BY kc.tema, fc.id
           LIMIT $${pLimit} OFFSET $${pOffset}`,
          params
        );

        return NextResponse.json({ data: res.rows, page, limit });
      }

      return NextResponse.json({ error: 'Tipo no válido' }, { status: 400 });
    });
  } catch (error) {
    console.error('GET /api/demo/content error', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
