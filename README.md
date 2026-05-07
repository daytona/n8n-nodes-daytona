# @daytona/n8n-nodes-daytona

The official [Daytona](https://www.daytona.io) community node for [n8n](https://n8n.io).

## Installation

Once published, install from inside n8n at **Settings → Community Nodes** by entering `@daytona/n8n-nodes-daytona`.

For local development:

```bash
npm install
npm run dev
```

## Credentials

Create an API key at [app.daytona.io/dashboard/keys](https://app.daytona.io/dashboard/keys), then add a **Daytona API** credential in n8n with that key.

If you run a self-hosted Daytona instance, override the **Base URL** field. If your API key belongs to multiple organizations or you're using a JWT token, set the **Organization ID** field.

## License

[MIT](./LICENSE) © Daytona Platforms Inc.
