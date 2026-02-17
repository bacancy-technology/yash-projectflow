# yash-projectflow

A full-featured project management SaaS (Jira-clone) built with Next.js and Supabase.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Seed Data

Populate the database with sample data (4 users, 2 projects, 20 issues, sprints, and more):

```bash
# Add SUPABASE_SERVICE_ROLE_KEY to .env.local first, then:
npm run seed
```

**Seed credentials:**

| User | Email | Role |
|---|---|---|
| Alice Johnson | alice@projectflow.dev | Owner |
| Bob Smith | bob@projectflow.dev | Admin |
| Carol Davis | carol@projectflow.dev | Member |
| David Wilson | david@projectflow.dev | Viewer |

Password: `Seed1234!`

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **UI**: Tailwind CSS v4 + shadcn/ui
- **Auth**: Supabase Auth
- **Editor**: TipTap rich text
- **Drag & Drop**: @hello-pangea/dnd
