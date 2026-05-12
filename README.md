# copilot-cli-loop-demo

A tiny Express tasks API used to **demo iterating the GitHub Copilot CLI over open issues in a loop**. Each issue is meant to be small, scoped, and independently fixable so `copilot` can resolve them one by one.

## What's in here

- `src/server.js` — Express app exposing `/health` and `/tasks` (GET / POST / DELETE).
- `src/index.js` — entrypoint, listens on `PORT` (default `3000`).
- `tests/server.test.js` — smoke test (`GET /health`).
- `scripts/run-loop.sh` / `scripts/run-loop.ps1` — driver scripts that iterate over open issues and invoke `copilot`.

The starting code is **deliberately minimal and imperfect** — the open issues describe exactly what to add or fix.

## Run locally

```bash
npm install
npm test
npm start
# in another shell
curl http://localhost:3000/health
```

## Run the Copilot CLI loop

Prerequisites:

- [`gh`](https://cli.github.com/) authenticated (`gh auth status`).
- [`copilot` CLI](https://github.com/github/copilot-cli) on PATH and signed in.
- A clone of this repo with `main` checked out.

Dry-run first (lists issues + planned actions, no copilot call):

```bash
# bash / WSL / macOS / Linux
bash scripts/run-loop.sh --dry-run --max 1

# Windows PowerShell
./scripts/run-loop.ps1 -DryRun -Max 1
```

Real run (one issue at a time, PR per issue):

```bash
bash scripts/run-loop.sh --max 1
./scripts/run-loop.ps1 -Max 1
```

For each open issue the script:

1. Creates branch `copilot/issue-<N>` from `main`.
2. Invokes `copilot -p "<prompt referencing issue #N>" --allow-all-tools`.
3. Pushes the branch and opens a PR with `gh pr create`.

The script stops at PR creation — review and merge manually.

## License

MIT — see [LICENSE](LICENSE).
