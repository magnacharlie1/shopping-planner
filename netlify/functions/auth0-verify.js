const { createRemoteJWKSet, jwtVerify } = require("jose");

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

if (!AUTH0_DOMAIN) {
  throw new Error("AUTH0_DOMAIN env var is required");
}

// This tells jose where to fetch Auth0's public keys
const JWKS = createRemoteJWKSet(
  new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`)
);

async function verifyAuth0Token(token) {
  if (!token) {
    throw new Error("Missing token");
  }

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `https://${AUTH0_DOMAIN}/`,
    // This checks the token was issued "for" our API
    audience: AUTH0_AUDIENCE || undefined,
  });

  // payload.sub is the unique user id
  return payload;
}

module.exports = { verifyAuth0Token };