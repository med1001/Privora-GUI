# Contributing to Privora-GUI

Thanks for your interest. **Issues and pull requests belong in this repository** (the React client).

## Quick local setup

1. `cp .env.example .env` — set `REACT_APP_API_URL` and `REACT_APP_WS_URL` to your API (e.g. `http://127.0.0.1:8000` and `ws://127.0.0.1:8000/ws`).
2. `cp src/firebase-config.example.ts src/firebase-config.ts` — add your Firebase **web** config.
3. Run the [backend](https://github.com/med1001/Privora), then `npm ci` and `npm start`.

## Full stack in one clone

Use the meta repository [**Privora-Workspace**](https://github.com/med1001/Privora-Workspace) (git submodules + `docker compose`). See that repo’s `docs/LOCAL_FULL_STACK.md`.

## Pull requests

- One logical change per PR when possible.
- Describe how to test (e.g. login, send message, start a call).
- Do not commit `.env`, `src/firebase-config.ts`, or secrets.
