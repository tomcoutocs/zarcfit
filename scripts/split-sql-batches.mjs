import { readFileSync, writeFileSync } from 'node:fs';

const seed = readFileSync('src/lib/supabase/exercise-library-expansion.sql', 'utf8');
const vids = readFileSync('src/lib/supabase/exercise-video-urls-expansion.sql', 'utf8');
const checks = readFileSync('src/lib/supabase/client-check-ins.sql', 'utf8');

const match = seed.match(/VALUES\n([\s\S]*?)\) AS seed/);
if (!match) throw new Error('no VALUES block');
const rows = match[1]
  .split(',\n')
  .map((s) => s.trim())
  .filter(Boolean);

const batches = [];
for (let i = 0; i < rows.length; i += 60) {
  const chunk = rows.slice(i, i + 60);
  batches.push(`INSERT INTO exercises (name, muscle_group, equipment, difficulty)
SELECT * FROM (VALUES
${chunk.join(',\n')}
) AS seed(name, muscle_group, equipment, difficulty)
WHERE NOT EXISTS (
  SELECT 1 FROM exercises e WHERE e.name = seed.name
);`);
}

const vidLines = vids.split('\n').filter((l) => l.startsWith('UPDATE'));
const vidsBatches = [];
for (let i = 0; i < vidLines.length; i += 80) {
  vidsBatches.push(vidLines.slice(i, i + 80).join('\n'));
}

writeFileSync(
  'scripts/.tmp-batches.json',
  JSON.stringify({ checks, batches, vidsBatches })
);
console.log({ rows: rows.length, batches: batches.length, vidsBatches: vidsBatches.length });
