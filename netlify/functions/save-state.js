const { Client } = require("pg");
const { verifyAuth0Token } = require("./auth0-verify");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    // 1. Get token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, body: "Missing Authorization header" };
    }

    const token = authHeader.slice("Bearer ".length).trim();

    // 2. Verify token and get user id
    const payload = await verifyAuth0Token(token);
    const userId = payload.sub;

    // 3. Parse JSON body (this will be your appState)
    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch (err) {
      return { statusCode: 400, body: "Invalid JSON" };
    }

    // 4. Connect to Neon
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 5. Upsert the user's state
    await client.query(
      `
      INSERT INTO user_states (user_id, data)
      VALUES ($1, $2)
      ON CONFLICT (user_id)
      DO UPDATE SET data = EXCLUDED.data, updated_at = now()
      `,
      [userId, data]
    );

    await client.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err) {
    console.error("save-state error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
