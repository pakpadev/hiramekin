# Hiramekin

閃筋 is an Expo bare workflow app for the fastest possible idea capture.

## Docker Development

Build the container:

```bash
docker compose build
```

Install dependencies inside Docker:

```bash
docker compose run --rm app npm install
```

Start the web development server:

```bash
docker compose up -d app
```

The Expo web server is available at:

```text
http://localhost:8081
```

Run checks:

```bash
docker compose run --rm app npm run typecheck
docker compose run --rm test npx jest --watchAll=false --passWithNoTests
docker compose run --rm app npx expo export --platform web
```

Visual smoke checks use Playwright with Chromium installed in the Docker image.
