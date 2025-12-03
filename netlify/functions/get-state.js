const { Client } = require("pg");
const { verifyAuth0Token } = require("./auth0-verify");

exports.handler = async (event) => {
  try {
    // 1. Extract token from Authorization header
    const authHeader = event.headers.authorization || event.headers.Authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return { statusCode: 401, body: "Missing Authorization header" };
    }

    const token = authHeader.slice("Bearer ".length).trim();

    // 2. Verify token with Auth0, get user info
    const payload = await verifyAuth0Token(token);
    const userId = payload.sub; // Auth0's unique user id for this person

    // 3. Connect to Neon
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    // 4. Look up that user's state
    const res = await client.query(
      "SELECT data FROM user_states WHERE user_id = $1",
      [userId]
    );

    await client.end();

    // 5. If no row yet, return null
    const body = res.rows.length === 0 ? null : res.rows[0].data;

    return {
      statusCode: 200,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    };
  } catch (err) {
    console.error("get-state error", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Server error" }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }
};
