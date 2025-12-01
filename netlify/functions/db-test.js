const { Client } = require("pg");

exports.handler = async (event, context) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Neon requires SSL
  });

  try {
    await client.connect();

    const resultNow = await client.query("SELECT now()");
    const resultCount = await client.query("SELECT COUNT(*) AS count FROM user_states");

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify(
        {
          ok: true,
          now: resultNow.rows[0].now,
          userStatesCount: resultCount.rows[0].count,
        },
        null,
        2
      ),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err) {
    console.error("DB test error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify(
        {
          ok: false,
          error: err.message,
        },
        null,
        2
      ),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
