# Repository Agent Instructions

## Home Assistant configuration

- Files under `/config` matching `*.yaml` are not directly writable in this environment; filesystem edits fail with `EACCES`.
- Change Home Assistant automations, scripts, scenes, dashboards, helpers, and related live configuration through the corresponding Home Assistant MCP APIs.
- Before changing Home Assistant configuration, read the `home-assistant-best-practices` skill and inspect the live object through MCP.

## JavaScript validation

- Node.js tooling is not installed: `node`, `npm`, and `npx` are unavailable.
- Do not attempt Node-based syntax checks, builds, or tests.
- Validate frontend JavaScript with VS Code diagnostics and live browser or Playwright inspection. Use other non-Node tooling only after confirming it is installed.
- After changing JavaScript loaded as a Lovelace resource, increment its URL cache key through the Home Assistant dashboard resource API before browser validation.
