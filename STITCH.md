Stitch integration

This project includes a minimal serverless endpoint to initiate payments via Stitch (or another payments provider).

Files added:
- `api/create-stitch-session.js` — serverless function (Vercel) that forwards the payment creation request to the provider.

Environment variables (set these in Vercel dashboard or locally):
- `STITCH_SECRET` — your Stitch API secret (required).
- `STITCH_API_URL` — (optional) provider endpoint to create payment requests. Defaults to `https://api.stitch.money/v1/payment-requests`.

How it works:
1. The checkout form collects customer and shipping details.
2. On submit the client posts an `order` payload to `/api/create-stitch-session`.
3. The serverless function forwards the payload to the provider using `STITCH_SECRET`.
4. The provider response is returned to the client; if it contains a `redirect_url` (or `url` / `payment_url`) the client will redirect the browser there to complete payment.

Notes / next steps:
- You must configure `STITCH_SECRET` in your Vercel project (Environment > Add). Do not commit secrets to the repo.
- Adjust `STITCH_API_URL` and payload shape to match Stitch's current API documentation (this repo forwards the payload as-is).
- For production, validate the provider response and persist order state on your server.
- Add webhook handling to verify completed payments and update order status.

Testing locally:
- You can run the site locally using a static server and a development proxy for the serverless function, or use `vercel dev` after installing the Vercel CLI and setting env vars.

If you want, I can adapt the payload to the exact Stitch API schema and implement webhooks once you provide API docs or a test key.
