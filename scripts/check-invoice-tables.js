const { Client } = require('pg');

(async () => {
  try {
    const url = process.env.DATABASE_URL;
    if (!url) {
      console.error('No DATABASE_URL set');
      process.exit(2);
    }
    const client = new Client({ connectionString: url });
    await client.connect();
    const res = await client.query(
      "select table_name from information_schema.tables where table_schema='public' and table_name like '%invoice%' order by table_name"
    );
    console.log(res.rows);
    await client.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
