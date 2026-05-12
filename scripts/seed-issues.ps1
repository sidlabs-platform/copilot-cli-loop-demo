# Seed 10 enhancement issues for the Copilot CLI loop demo.
# Run from c:\temp\loop-demo after the repo has been created.

$ErrorActionPreference = "Stop"

# Ensure labels exist (ignore errors if already present).
$labels = @(
  @{ name = "enhancement"; color = "a2eeef"; description = "New feature or request" },
  @{ name = "bug";         color = "d73a4a"; description = "Something isn't working" },
  @{ name = "polish";      color = "c5def5"; description = "Code quality / DX improvement" }
)
foreach ($l in $labels) {
  gh label create $l.name --color $l.color --description $l.description 2>$null
}

$issues = @(
  @{
    title = "Add PUT /tasks/:id to update a task"
    label = "enhancement"
    body  = @"
Add a ``PUT /tasks/:id`` endpoint that updates the ``title`` and/or ``completed`` fields of an existing task.

Acceptance criteria:
- Returns ``200`` and the updated task on success.
- Returns ``404`` if the id does not exist.
- Returns ``400`` if neither ``title`` nor ``completed`` is provided, or if ``completed`` is not a boolean.
- Add at least one test covering the success path and one covering 404.
"@
  },
  @{
    title = "Add PATCH /tasks/:id/complete toggle endpoint"
    label = "enhancement"
    body  = @"
Add ``PATCH /tasks/:id/complete`` which toggles the ``completed`` boolean on the given task.

Acceptance criteria:
- Returns ``200`` and the updated task.
- Returns ``404`` when the id is unknown.
- Add a test that POSTs a task, PATCHes it twice, and asserts the toggle behavior.
"@
  },
  @{
    title = "Support filtering tasks by completed status"
    label = "enhancement"
    body  = @"
Extend ``GET /tasks`` to accept an optional ``completed`` query parameter:

- ``GET /tasks?completed=true`` returns only completed tasks.
- ``GET /tasks?completed=false`` returns only incomplete tasks.
- No query parameter returns all tasks (current behavior).
- Any other value returns ``400`` with a clear error message.

Add tests for all three valid cases and the invalid case.
"@
  },
  @{
    title = "Persist tasks to a JSON file"
    label = "enhancement"
    body  = @"
Replace the in-memory array with persistence to a ``tasks.json`` file at the repo root.

Acceptance criteria:
- Load existing tasks from ``tasks.json`` on startup (if the file exists).
- Write to ``tasks.json`` after every mutation (POST, DELETE, and any update endpoints).
- The file path should be overridable via a ``TASKS_FILE`` env var so tests can use a temp file.
- ``tasks.json`` is already in ``.gitignore``; keep it that way.
- Tests must not write to the repo root — they should use a temp file via ``TASKS_FILE``.
"@
  },
  @{
    title = "POST /tasks should reject empty/missing title with 400"
    label = "bug"
    body  = @"
Currently ``POST /tasks`` happily creates a task with an undefined or empty title.

Expected: respond ``400 Bad Request`` with ``{ "error": "title is required" }`` when:
- Request body is missing.
- ``title`` is missing.
- ``title`` is not a string or is an empty/whitespace-only string.

Add tests for each invalid case plus the existing valid case.
"@
  },
  @{
    title = "DELETE /tasks/:id returns 200 even when id does not exist"
    label = "bug"
    body  = @"
``DELETE /tasks/:id`` always returns ``200`` regardless of whether the id existed.

Expected: return ``404`` with ``{ "error": "task not found" }`` when no task matches the id. Return ``204`` (no body) on successful deletion.

Add tests covering both 204 and 404 cases.
"@
  },
  @{
    title = "Task id collisions possible — use a stable counter or UUID"
    label = "bug"
    body  = @"
Task ids are currently derived from ``tasks.length + 1``. After a delete, new tasks can collide with existing ids.

Expected: use a monotonically increasing counter (or ``crypto.randomUUID()``) so ids are unique for the lifetime of the process.

Add a test that creates a task, deletes it, creates another, and asserts the two ids differ.
"@
  },
  @{
    title = "Add request logging middleware"
    label = "polish"
    body  = @"
Add a small Express middleware that logs each request as a single line: ``METHOD PATH STATUS DURATION_MS``.

Acceptance criteria:
- Logs via ``console.log``.
- Disabled when ``process.env.NODE_ENV === 'test'`` so test output stays clean.
- No new runtime dependency required (do not add ``morgan``).
"@
  },
  @{
    title = "Add ESLint + Prettier and an npm run lint script"
    label = "polish"
    body  = @"
Set up ESLint (with the recommended config) and Prettier.

Acceptance criteria:
- Add ``eslint`` and ``prettier`` as devDependencies.
- Add ``.eslintrc.json`` and ``.prettierrc`` with sensible defaults (2-space indent, single quotes, semicolons).
- Add ``npm run lint`` that runs ESLint over ``src/`` and ``tests/``.
- ``npm run lint`` must pass with zero errors on the current codebase (fix issues if any).
"@
  },
  @{
    title = "Add GitHub Actions CI workflow running npm test"
    label = "polish"
    body  = @"
Add ``.github/workflows/ci.yml`` that runs on ``push`` and ``pull_request`` to ``main``:

- Use ``ubuntu-latest``.
- Set up Node.js 20 via ``actions/setup-node@v4`` with ``cache: 'npm'``.
- Run ``npm ci`` then ``npm test``.
- (If ``npm run lint`` exists, also run it.)
"@
  }
)

foreach ($i in $issues) {
  Write-Host "Creating: $($i.title)"
  gh issue create --title $i.title --body $i.body --label $i.label | Out-Host
}

Write-Host ""
Write-Host "Done. Current open issues:"
gh issue list --state open
