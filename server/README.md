# Bootflow - Gateway Keys Server

This is a minimal server to store gateway credentials encrypted at rest. It is intended as a small, local service you can run alongside the frontend for safe credential persistence.

WARNING: This is a simple implementation for development/prototyping. For production, use a hardened service, proper secret management (e.g. HashiCorp Vault, AWS KMS), TLS, authentication, and secure hosting.

## Endpoints
- GET `/credentials/:gatewayId` - returns decrypted credentials for the gateway.
- POST `/credentials/:gatewayId` - body: `{ apiKey, secret, webhook? }` - stores encrypted credentials.
- DELETE `/credentials/:gatewayId` - deletes stored credentials.
- GET `/health` - health check.

## Setup
1. Install dependencies:

```powershell
cd server
npm install
```

2. Create a `.env` file with a strong secret:

```
GATEWAY_KEYS_SECRET=choose_a_strong_secret_here
PORT=4001
```

3. Run the server:

```powershell
npm start
```

## Example
Store credentials:

```powershell
curl -X POST http://localhost:4001/credentials/2 -H "Content-Type: application/json" -d '{"apiKey":"sk_test_...","secret":"s3cr3t","webhook":"https://example.com/webhook"}'
```

Get credentials:

```powershell
curl http://localhost:4001/credentials/2
```

Delete credentials:

```powershell
curl -X DELETE http://localhost:4001/credentials/2
```

## Notes
- The service expects `GATEWAY_KEYS_SECRET` to be defined. Do not commit this secret to the repository.
- The server stores encrypted blobs in `server/data/credentials.json`. For safety, add that file to your `.gitignore` in production setups.
