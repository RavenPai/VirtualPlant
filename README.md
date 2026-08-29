# Virtual Plant

Gamified 90-day plant PWA. The live UI still uses the existing React screens and plant formulas. Persistence and automation now target **Supabase**, **n8n**, and **Python FastAPI** instead of PHP/MySQL (this repo never contained PHP).

## Layout

- React + Vite + Tailwind + Canvas — repository root (`src/`, `public/`)
- `backend-python/` — FastAPI (decay, growth, 6-task ML deck)
- `n8n/workflows/` — importable automation graphs
- `supabase/migrations/` — PostgreSQL schema + RLS

## Local development

```bash
cp .env.example .env
# fill VITE_SUPABASE_PUBLISHABLE_KEY (and optional API URLs)

npm install
npm run dev
```

```bash
cd backend-python
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Supabase CLI (when you are logged in):

```bash
supabase login
supabase init
supabase link --project-ref ytxxcnlajceojbdxreku
supabase db push
```

Enable **anonymous sign-in** in Supabase Auth if you want cloud saves from the PWA.

## Netlify

- Build: `npm run build`
- Publish: `dist`
- Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_PYTHON_API_URL`, `VITE_N8N_API_URL`

## Render

- Root directory: `backend-python`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
