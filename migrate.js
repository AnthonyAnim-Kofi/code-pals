import { Client } from 'pg';

const oldDbUrl = 'postgresql://postgres.unzarsdejxnnfzxirmqn:King7himself%21@aws-0-eu-west-1.pooler.supabase.com:6543/postgres';
const newDbUrl = 'postgresql://postgres:57Sr5QcFUqXJ7siI@db.crygmmjoyyuqztjvvhpw.supabase.co:5432/postgres';

// Tables to migrate in topological order (no foreign key conflicts)
const tables = [
  { schema: 'auth', name: 'users' },
  { schema: 'public', name: 'profiles' },
  { schema: 'public', name: 'lessons' },
  { schema: 'public', name: 'achievements' },
  { schema: 'public', name: 'user_achievements' },
  { schema: 'public', name: 'daily_quests' },
  { schema: 'public', name: 'daily_quest_progress' },
  { schema: 'public', name: 'leagues' },
  { schema: 'public', name: 'user_leagues' },
  { schema: 'public', name: 'friendships' }
];

async function migrate() {
  const oldClient = new Client({ connectionString: oldDbUrl });
  const newClient = new Client({ connectionString: newDbUrl });

  try {
    console.log('Connecting to old database...');
    await oldClient.connect();
    console.log('Connecting to new database...');
    await newClient.connect();
    
    // Disable triggers on the new DB to allow inserting rows with existing IDs and FKs
    console.log('Disabling triggers on target database...');
    await newClient.query('SET session_replication_role = replica;');

    for (const table of tables) {
      console.log(`\nMigrating ${table.schema}.${table.name}...`);
      
      const { rows } = await oldClient.query(`SELECT * FROM ${table.schema}.${table.name}`);
      console.log(`Found ${rows.length} rows.`);

      if (rows.length === 0) continue;

      const keys = Object.keys(rows[0]);
      
      // We will do bulk inserts into the target database.
      // If a row exists, we do nothing (ON CONFLICT DO NOTHING).
      // Since `auth.users` has no obvious unique constraint other than id, DO NOTHING works.
      const columns = keys.map(k => `"${k}"`).join(', ');
      
      let inserted = 0;
      for (const row of rows) {
        const values = keys.map(k => row[k]);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        
        try {
          await newClient.query(
            `INSERT INTO ${table.schema}.${table.name} (${columns}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
          inserted++;
        } catch (e) {
          console.error(`Error inserting row into ${table.name}:`, e.message);
        }
      }
      console.log(`Inserted ${inserted}/${rows.length} rows.`);
    }

    // Re-enable triggers
    console.log('\nRe-enabling triggers...');
    await newClient.query('SET session_replication_role = DEFAULT;');

    console.log('\nMigration complete!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await oldClient.end();
    await newClient.end();
  }
}

migrate();
