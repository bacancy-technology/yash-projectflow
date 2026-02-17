/**
 * ProjectFlow – Database Seed Script
 *
 * Prerequisites:
 *   1. Add SUPABASE_SERVICE_ROLE_KEY to your .env.local
 *      (Supabase Dashboard → Project Settings → API → service_role key)
 *
 * Run:
 *   npm run seed
 *
 * What this creates:
 *   - 4 auth users  (alice, bob, carol, david @projectflow.dev  pw: Seed1234!)
 *   - 1 organisation  (Acme Corp, Pro plan)
 *   - 2 projects      (Website Redesign · WEB, Mobile App · MOB)
 *   - 4 board columns per project
 *   - 5 labels per project
 *   - 2 sprints per project (1 completed, 1 active)
 *   - 10 issues per project (various types, priorities, assignees)
 *   - issue ↔ label links
 *   - comments on issues
 *   - time entries
 *   - activity log entries
 *   - notifications
 */

import { readFileSync } from 'fs'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Load .env.local manually (no dotenv dependency needed)
// ---------------------------------------------------------------------------
try {
  const raw = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    if (key && !(key in process.env)) process.env[key] = val
  }
} catch {
  // ignore – env vars might already be set
}

// ---------------------------------------------------------------------------
// Validate env
// ---------------------------------------------------------------------------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('\n❌  Missing environment variables.')
  console.error('   Make sure .env.local contains:')
  console.error('     NEXT_PUBLIC_SUPABASE_URL=...')
  console.error('     SUPABASE_SERVICE_ROLE_KEY=...\n')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function log(msg: string) { console.log(`  ${msg}`) }
function ok(msg: string)  { console.log(`  ✓ ${msg}`) }

function must<T>(label: string, data: T | null, error: unknown): T {
  if (error) {
    console.error(`\n❌  ${label}:`, error)
    process.exit(1)
  }
  return data as T
}

/** Minimal TipTap document with one paragraph */
function doc(...paragraphs: string[]) {
  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  }
}

/** ISO date string N days in the past */
function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

/** ISO date string N days in the future */
function daysAhead(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

// ---------------------------------------------------------------------------
// Static seed data
// ---------------------------------------------------------------------------

const USERS = [
  { email: 'alice@projectflow.dev', full_name: 'Alice Johnson', avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice' },
  { email: 'bob@projectflow.dev',   full_name: 'Bob Smith',     avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob'   },
  { email: 'carol@projectflow.dev', full_name: 'Carol Davis',   avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carol' },
  { email: 'david@projectflow.dev', full_name: 'David Wilson',  avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=david' },
]
const USER_PASSWORD = 'Seed1234!'

const COLUMN_NAMES = [
  { name: 'To Do',       color: '#e2e8f0', position: 0 },
  { name: 'In Progress', color: '#bfdbfe', position: 1 },
  { name: 'In Review',   color: '#fed7aa', position: 2 },
  { name: 'Done',        color: '#bbf7d0', position: 3 },
]

const LABEL_SETS = {
  WEB: [
    { name: 'Frontend',      color: '#60a5fa' },
    { name: 'Backend',       color: '#34d399' },
    { name: 'Bug',           color: '#f87171' },
    { name: 'Feature',       color: '#a78bfa' },
    { name: 'Accessibility', color: '#fbbf24' },
  ],
  MOB: [
    { name: 'iOS',           color: '#818cf8' },
    { name: 'Android',       color: '#34d399' },
    { name: 'Bug',           color: '#f87171' },
    { name: 'Performance',   color: '#fb923c' },
    { name: 'UX',            color: '#f472b6' },
  ],
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log('\n🌱  ProjectFlow seed starting…\n')

  // -------------------------------------------------------------------------
  // 1. Auth users
  // -------------------------------------------------------------------------
  console.log('👤  Creating auth users…')
  const userIds: string[] = []

  for (const u of USERS) {
    // Try creating; if email already exists, look up existing user
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: USER_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.full_name, avatar_url: u.avatar_url },
    })

    if (error) {
      if ((error as { code?: string }).code === 'email_exists') {
        // Fetch existing user id
        const { data: list } = await supabase.auth.admin.listUsers()
        const existing = list?.users.find((usr) => usr.email === u.email)
        if (!existing) {
          console.error(`  ❌  Could not find existing user ${u.email}`)
          process.exit(1)
        }
        userIds.push(existing.id)
        ok(`${u.full_name} (existing)`)
      } else {
        console.error(`  ❌  Failed to create ${u.email}:`, error.message)
        process.exit(1)
      }
    } else {
      userIds.push(data.user.id)
      ok(`${u.full_name} – ${u.email}`)
    }
  }

  const [aliceId, bobId, carolId, davidId] = userIds

  // -------------------------------------------------------------------------
  // 2. Ensure profiles exist (trigger fires on INSERT to auth.users,
  //    but let's upsert to be safe in case metadata changed)
  // -------------------------------------------------------------------------
  console.log('\n🪪  Upserting profiles…')
  for (let i = 0; i < USERS.length; i++) {
    const { error } = await supabase.from('profiles').upsert({
      id:         userIds[i],
      email:      USERS[i].email,
      full_name:  USERS[i].full_name,
      avatar_url: USERS[i].avatar_url,
    }, { onConflict: 'id' })
    if (error) console.warn(`  ⚠  profile upsert for ${USERS[i].email}:`, error.message)
    else ok(USERS[i].full_name)
  }

  // -------------------------------------------------------------------------
  // 3. Organization
  // -------------------------------------------------------------------------
  console.log('\n🏢  Creating organization…')

  // Upsert by slug so re-runs are idempotent
  const { data: orgData, error: orgErr } = await supabase
    .from('organizations')
    .upsert({ name: 'Acme Corp', slug: 'acme-corp', owner_id: aliceId, plan: 'pro' }, { onConflict: 'slug' })
    .select()
    .single()

  const org = must('create organization', orgData, orgErr)
  ok(`${org.name} (id: ${org.id})`)

  // -------------------------------------------------------------------------
  // 4. Organization members
  // -------------------------------------------------------------------------
  console.log('\n👥  Adding organization members…')
  const memberRows = [
    { org_id: org.id, user_id: aliceId, role: 'owner', accepted_at: new Date().toISOString() },
    { org_id: org.id, user_id: bobId,   role: 'admin', accepted_at: new Date().toISOString() },
    { org_id: org.id, user_id: carolId, role: 'member', accepted_at: new Date().toISOString() },
    { org_id: org.id, user_id: davidId, role: 'viewer', accepted_at: new Date().toISOString() },
  ]
  const { error: memErr } = await supabase
    .from('organization_members')
    .upsert(memberRows, { onConflict: 'org_id,user_id' })
  if (memErr) console.warn('  ⚠  members upsert:', memErr.message)
  else ok('4 members added (owner · admin · member · viewer)')

  // -------------------------------------------------------------------------
  // 5. Subscription
  // -------------------------------------------------------------------------
  console.log('\n💳  Creating subscription…')
  const { error: subErr } = await supabase
    .from('subscriptions')
    .upsert({
      org_id:               org.id,
      plan:                 'pro',
      status:               'active',
      current_period_start: new Date().toISOString(),
      current_period_end:   new Date(Date.now() + 30 * 864e5).toISOString(),
    }, { onConflict: 'org_id' })
  if (subErr) console.warn('  ⚠  subscription upsert:', subErr.message)
  else ok('Pro plan – active')

  // -------------------------------------------------------------------------
  // 6. Projects
  // -------------------------------------------------------------------------
  console.log('\n📁  Creating projects…')
  const projectDefs = [
    {
      org_id: org.id, created_by: aliceId,
      name: 'Website Redesign', key: 'WEB', icon: '🌐',
      description: 'Complete overhaul of the company website with a modern design system.',
    },
    {
      org_id: org.id, created_by: bobId,
      name: 'Mobile App', key: 'MOB', icon: '📱',
      description: 'Cross-platform mobile application for iOS and Android.',
    },
  ]

  const projects: { id: string; key: string }[] = []
  for (const def of projectDefs) {
    // Try insert; if key already exists for this org, fetch it
    const { data: existing } = await supabase
      .from('projects')
      .select('id, key')
      .eq('org_id', org.id)
      .eq('key', def.key)
      .single()

    if (existing) {
      projects.push(existing)
      ok(`${def.name} (existing)`)
    } else {
      const { data: proj, error: projErr } = await supabase
        .from('projects')
        .insert(def)
        .select('id, key')
        .single()
      must(`create project ${def.key}`, proj, projErr)
      projects.push(proj!)
      ok(`${def.name} (id: ${proj!.id})`)
    }
  }

  const [webProject, mobProject] = projects

  // -------------------------------------------------------------------------
  // 7. Board columns
  // -------------------------------------------------------------------------
  console.log('\n📋  Creating board columns…')
  const columnIds: Record<string, string[]> = {}

  for (const proj of projects) {
    // Check if columns already exist
    const { data: existing } = await supabase
      .from('board_columns')
      .select('id, name')
      .eq('project_id', proj.id)
      .order('position')

    if (existing && existing.length === 4) {
      columnIds[proj.id] = existing.map((c: { id: string }) => c.id)
      ok(`${proj.key} – columns already exist`)
      continue
    }

    const rows = COLUMN_NAMES.map((c) => ({ ...c, project_id: proj.id }))
    const { data: cols, error: colErr } = await supabase
      .from('board_columns')
      .insert(rows)
      .select('id')
    must(`create columns for ${proj.key}`, cols, colErr)
    columnIds[proj.id] = cols!.map((c: { id: string }) => c.id)
    ok(`${proj.key} – 4 columns`)
  }

  // Convenience aliases: [todo, inProgress, inReview, done]
  const webCols = columnIds[webProject.id]
  const mobCols = columnIds[mobProject.id]

  // -------------------------------------------------------------------------
  // 8. Labels
  // -------------------------------------------------------------------------
  console.log('\n🏷  Creating labels…')
  const labelIds: Record<string, string[]> = {}

  for (const proj of projects) {
    const set = LABEL_SETS[proj.key as keyof typeof LABEL_SETS]

    const { data: existing } = await supabase
      .from('labels')
      .select('id')
      .eq('project_id', proj.id)

    if (existing && existing.length >= 5) {
      labelIds[proj.id] = existing.map((l: { id: string }) => l.id)
      ok(`${proj.key} – labels already exist`)
      continue
    }

    const rows = set.map((l) => ({ ...l, project_id: proj.id }))
    const { data: labs, error: labErr } = await supabase
      .from('labels')
      .insert(rows)
      .select('id')
    must(`create labels for ${proj.key}`, labs, labErr)
    labelIds[proj.id] = labs!.map((l: { id: string }) => l.id)
    ok(`${proj.key} – ${set.length} labels`)
  }

  // -------------------------------------------------------------------------
  // 9. Sprints
  // -------------------------------------------------------------------------
  console.log('\n🏃  Creating sprints…')
  const sprintIds: Record<string, string[]> = {}

  const sprintDefs: Record<string, { name: string; goal: string; start_date: string; end_date: string; status: string }[]> = {
    [webProject.id]: [
      {
        name: 'Sprint 1 – Foundation',
        goal: 'Set up design system and core layout components',
        start_date: daysAgo(28),
        end_date:   daysAgo(14),
        status:     'completed',
      },
      {
        name: 'Sprint 2 – Core Pages',
        goal: 'Build landing, about, pricing and blog pages',
        start_date: daysAgo(13),
        end_date:   daysAhead(1),
        status:     'active',
      },
    ],
    [mobProject.id]: [
      {
        name: 'Sprint 1 – MVP',
        goal: 'Auth flow, onboarding and home screen',
        start_date: daysAgo(21),
        end_date:   daysAgo(7),
        status:     'completed',
      },
      {
        name: 'Sprint 2 – Core Features',
        goal: 'Dashboard, notifications and profile screens',
        start_date: daysAgo(6),
        end_date:   daysAhead(8),
        status:     'active',
      },
    ],
  }

  for (const proj of projects) {
    const { data: existing } = await supabase
      .from('sprints')
      .select('id')
      .eq('project_id', proj.id)
      .order('created_at')

    if (existing && existing.length >= 2) {
      sprintIds[proj.id] = existing.map((s: { id: string }) => s.id)
      ok(`${proj.key} – sprints already exist`)
      continue
    }

    const rows = sprintDefs[proj.id].map((s) => ({ ...s, project_id: proj.id }))
    // Insert sequentially to respect the single-active-sprint trigger
    const ids: string[] = []
    for (const row of rows) {
      const { data: sp, error: spErr } = await supabase
        .from('sprints')
        .insert(row)
        .select('id')
        .single()
      must(`create sprint for ${proj.key}`, sp, spErr)
      ids.push(sp!.id)
    }
    sprintIds[proj.id] = ids
    ok(`${proj.key} – 2 sprints (completed + active)`)
  }

  const [webSprint1, webSprint2] = sprintIds[webProject.id]
  const [mobSprint1, mobSprint2] = sprintIds[mobProject.id]

  // -------------------------------------------------------------------------
  // 10. Issues
  // -------------------------------------------------------------------------
  console.log('\n🐛  Creating issues…')

  // issue_number is auto-set by trigger; we just omit it
  const webIssueDefs = [
    // Done (sprint 1 – completed)
    {
      column_id: webCols[3], sprint_id: webSprint1, type: 'story',   priority: 'high',
      title: 'Set up Tailwind CSS design tokens',
      description: doc('Define colour palette, typography scale, spacing, and shadow tokens in the Tailwind config.'),
      assignee_id: aliceId, reporter_id: aliceId,
      story_points: 3, start_date: daysAgo(27), due_date: daysAgo(20), position: 0,
    },
    {
      column_id: webCols[3], sprint_id: webSprint1, type: 'task',    priority: 'medium',
      title: 'Create reusable Button component',
      description: doc('Build a Button component with primary, secondary, and ghost variants. Include size props (sm, md, lg).'),
      assignee_id: bobId, reporter_id: aliceId,
      story_points: 2, start_date: daysAgo(26), due_date: daysAgo(18), position: 1,
    },
    {
      column_id: webCols[3], sprint_id: webSprint1, type: 'task',    priority: 'medium',
      title: 'Responsive navigation header',
      description: doc('Implement the top navigation with mobile hamburger menu and smooth slide-in drawer.'),
      assignee_id: carolId, reporter_id: bobId,
      story_points: 5, start_date: daysAgo(25), due_date: daysAgo(15), position: 2,
    },
    // In Progress / In Review (sprint 2 – active)
    {
      column_id: webCols[1], sprint_id: webSprint2, type: 'story',   priority: 'high',
      title: 'Landing page hero section',
      description: doc(
        'Build the hero section with animated headline, subheadline, CTA buttons, and a product screenshot.',
        'Ensure the animation respects prefers-reduced-motion.'
      ),
      assignee_id: aliceId, reporter_id: aliceId,
      story_points: 8, start_date: daysAgo(12), due_date: daysAhead(0), position: 0,
    },
    {
      column_id: webCols[2], sprint_id: webSprint2, type: 'task',    priority: 'high',
      title: 'Pricing page with plan comparison table',
      description: doc('Display Free, Pro, and Enterprise plans side-by-side. Highlight the recommended plan. Add a FAQ section below.'),
      assignee_id: bobId, reporter_id: aliceId,
      story_points: 5, start_date: daysAgo(10), due_date: daysAhead(1), position: 1,
    },
    {
      column_id: webCols[1], sprint_id: webSprint2, type: 'bug',     priority: 'critical',
      title: 'Footer links broken on mobile viewport',
      description: doc('On screens < 375px the footer columns collapse incorrectly causing links to overflow. Repro: Chrome 125, iPhone SE.'),
      assignee_id: carolId, reporter_id: davidId,
      story_points: 2, start_date: daysAgo(3), due_date: daysAhead(1), position: 2,
    },
    // Backlog / To Do (sprint 2)
    {
      column_id: webCols[0], sprint_id: webSprint2, type: 'task',    priority: 'medium',
      title: 'Blog listing page with pagination',
      description: doc('Show 9 posts per page with Prev / Next navigation. Support URL-based page params for SSR.'),
      assignee_id: null, reporter_id: aliceId,
      story_points: 3, start_date: null, due_date: daysAhead(5), position: 3,
    },
    {
      column_id: webCols[0], sprint_id: null, type: 'epic',       priority: 'low',
      title: 'SEO & Performance Optimisation',
      description: doc('Improve Core Web Vitals scores to 90+ on mobile. Implement structured data, meta tags, and image optimisation.'),
      assignee_id: aliceId, reporter_id: aliceId,
      story_points: 13, start_date: null, due_date: daysAhead(14), position: 4,
    },
    {
      column_id: webCols[0], sprint_id: null, type: 'task',       priority: 'low',
      title: 'Dark mode support',
      description: doc('Add CSS variable–based dark theme. Respect system preference and allow user toggle stored in localStorage.'),
      assignee_id: bobId, reporter_id: carolId,
      story_points: 5, start_date: null, due_date: null, position: 5,
    },
    {
      column_id: webCols[0], sprint_id: null, type: 'bug',        priority: 'high',
      title: 'CLS jump on font load in Safari',
      description: doc('The page layout shifts after the custom font loads in Safari 17. Add font-display: swap and size-adjust.'),
      assignee_id: null, reporter_id: bobId,
      story_points: 1, start_date: null, due_date: null, position: 6,
    },
  ]

  const mobIssueDefs = [
    // Done (sprint 1)
    {
      column_id: mobCols[3], sprint_id: mobSprint1, type: 'story',   priority: 'high',
      title: 'Email / password authentication screen',
      description: doc('Login and sign-up screens with form validation, error states, and "forgot password" flow.'),
      assignee_id: aliceId, reporter_id: aliceId,
      story_points: 5, start_date: daysAgo(20), due_date: daysAgo(12), position: 0,
    },
    {
      column_id: mobCols[3], sprint_id: mobSprint1, type: 'task',    priority: 'high',
      title: 'Onboarding carousel (3 screens)',
      description: doc('Show three illustrated onboarding screens on first launch with skip and Get Started CTA.'),
      assignee_id: carolId, reporter_id: bobId,
      story_points: 3, start_date: daysAgo(18), due_date: daysAgo(9), position: 1,
    },
    {
      column_id: mobCols[3], sprint_id: mobSprint1, type: 'bug',     priority: 'critical',
      title: 'Crash on Android 12 during login',
      description: doc('NullPointerException thrown when biometrics permission is denied. Add null check and fallback to PIN.'),
      assignee_id: bobId, reporter_id: davidId,
      story_points: 2, start_date: daysAgo(14), due_date: daysAgo(8), position: 2,
    },
    // In Progress (sprint 2)
    {
      column_id: mobCols[1], sprint_id: mobSprint2, type: 'story',   priority: 'high',
      title: 'Home dashboard with activity feed',
      description: doc(
        'Display recent activity, quick action buttons, and a summary card at the top.',
        'Pull-to-refresh should trigger a live data reload.'
      ),
      assignee_id: aliceId, reporter_id: aliceId,
      story_points: 8, start_date: daysAgo(5), due_date: daysAhead(3), position: 0,
    },
    {
      column_id: mobCols[1], sprint_id: mobSprint2, type: 'task',    priority: 'medium',
      title: 'Push notification opt-in flow',
      description: doc('Request permission on first relevant action (not on launch). Show a pre-permission explanation modal.'),
      assignee_id: carolId, reporter_id: aliceId,
      story_points: 3, start_date: daysAgo(4), due_date: daysAhead(2), position: 1,
    },
    // In Review (sprint 2)
    {
      column_id: mobCols[2], sprint_id: mobSprint2, type: 'task',    priority: 'high',
      title: 'User profile screen with avatar upload',
      description: doc('Allow users to update display name, avatar (camera or gallery), and timezone. Persist changes to Supabase Storage.'),
      assignee_id: bobId, reporter_id: carolId,
      story_points: 5, start_date: daysAgo(6), due_date: daysAhead(0), position: 2,
    },
    // To Do
    {
      column_id: mobCols[0], sprint_id: mobSprint2, type: 'task',    priority: 'medium',
      title: 'In-app notifications centre',
      description: doc('Notification list screen with read / unread state, type icons, and mark-all-as-read action.'),
      assignee_id: null, reporter_id: aliceId,
      story_points: 3, start_date: null, due_date: daysAhead(7), position: 3,
    },
    {
      column_id: mobCols[0], sprint_id: null, type: 'epic',       priority: 'medium',
      title: 'Offline mode & local data sync',
      description: doc('Cache critical data locally with SQLite. Queue mutations when offline and sync on reconnect using a conflict-resolution strategy.'),
      assignee_id: aliceId, reporter_id: aliceId,
      story_points: 21, start_date: null, due_date: daysAhead(30), position: 4,
    },
    {
      column_id: mobCols[0], sprint_id: null, type: 'bug',        priority: 'high',
      title: 'Memory leak in image list on iOS',
      description: doc('Scrolling through 200+ images causes memory warnings and eventual crash. Investigate FlatList recycling.'),
      assignee_id: carolId, reporter_id: davidId,
      story_points: 3, start_date: null, due_date: null, position: 5,
    },
    {
      column_id: mobCols[0], sprint_id: null, type: 'task',       priority: 'low',
      title: 'App icon & splash screen assets',
      description: doc('Export final icon and splash screen in all required resolutions for App Store and Google Play submission.'),
      assignee_id: davidId, reporter_id: aliceId,
      story_points: 1, start_date: null, due_date: null, position: 6,
    },
  ]

  const issueMap: Record<string, string[]> = {}

  for (const [proj, defs] of [
    [webProject, webIssueDefs],
    [mobProject, mobIssueDefs],
  ] as [{ id: string; key: string }, typeof webIssueDefs][]) {
    // Check if issues already exist
    const { data: existing } = await supabase
      .from('issues')
      .select('id')
      .eq('project_id', proj.id)

    if (existing && existing.length >= defs.length) {
      issueMap[proj.id] = existing.map((i: { id: string }) => i.id)
      ok(`${proj.key} – issues already exist`)
      continue
    }

    const rows = defs.map((d) => ({ ...d, project_id: proj.id }))
    const { data: issues, error: issErr } = await supabase
      .from('issues')
      .insert(rows)
      .select('id')
    must(`create issues for ${proj.key}`, issues, issErr)
    issueMap[proj.id] = issues!.map((i: { id: string }) => i.id)
    ok(`${proj.key} – ${defs.length} issues`)
  }

  const webIssueIds = issueMap[webProject.id]
  const mobIssueIds = issueMap[mobProject.id]

  // -------------------------------------------------------------------------
  // 11. Issue labels
  // -------------------------------------------------------------------------
  console.log('\n🏷  Linking issue labels…')
  const [webL0, webL1, webL2, webL3, webL4] = labelIds[webProject.id]
  const [mobL0, mobL1, mobL2, mobL3, mobL4] = labelIds[mobProject.id]

  const issueLabelRows = [
    // WEB issues
    { issue_id: webIssueIds[0], label_id: webL1 }, // Backend
    { issue_id: webIssueIds[0], label_id: webL3 }, // Feature
    { issue_id: webIssueIds[1], label_id: webL0 }, // Frontend
    { issue_id: webIssueIds[2], label_id: webL0 }, // Frontend
    { issue_id: webIssueIds[3], label_id: webL0 }, // Frontend
    { issue_id: webIssueIds[3], label_id: webL3 }, // Feature
    { issue_id: webIssueIds[4], label_id: webL0 }, // Frontend
    { issue_id: webIssueIds[5], label_id: webL2 }, // Bug
    { issue_id: webIssueIds[6], label_id: webL1 }, // Backend
    { issue_id: webIssueIds[7], label_id: webL4 }, // Accessibility
    { issue_id: webIssueIds[8], label_id: webL0 }, // Frontend
    { issue_id: webIssueIds[9], label_id: webL2 }, // Bug
    // MOB issues
    { issue_id: mobIssueIds[0], label_id: mobL0 }, // iOS
    { issue_id: mobIssueIds[0], label_id: mobL1 }, // Android
    { issue_id: mobIssueIds[1], label_id: mobL4 }, // UX
    { issue_id: mobIssueIds[2], label_id: mobL2 }, // Bug
    { issue_id: mobIssueIds[2], label_id: mobL1 }, // Android
    { issue_id: mobIssueIds[3], label_id: mobL3 }, // Performance
    { issue_id: mobIssueIds[4], label_id: mobL0 }, // iOS
    { issue_id: mobIssueIds[4], label_id: mobL1 }, // Android
    { issue_id: mobIssueIds[5], label_id: mobL4 }, // UX
    { issue_id: mobIssueIds[6], label_id: mobL0 }, // iOS
    { issue_id: mobIssueIds[8], label_id: mobL2 }, // Bug
    { issue_id: mobIssueIds[8], label_id: mobL3 }, // Performance
  ]

  const { error: ilErr } = await supabase
    .from('issue_labels')
    .upsert(issueLabelRows, { onConflict: 'issue_id,label_id' })
  if (ilErr) console.warn('  ⚠  issue_labels upsert:', ilErr.message)
  else ok(`${issueLabelRows.length} links created`)

  // -------------------------------------------------------------------------
  // 12. Comments
  // -------------------------------------------------------------------------
  console.log('\n💬  Creating comments…')
  const commentRows = [
    // WEB-4 (landing hero)
    {
      issue_id: webIssueIds[3], author_id: bobId,
      content: doc("I've pushed the animation code. Could you review the CSS transition on the headline? I'm not 100% sure about the easing."),
    },
    {
      issue_id: webIssueIds[3], author_id: aliceId,
      content: doc('Looks great! One suggestion – use cubic-bezier(0.16,1,0.3,1) for a snappier feel. Also add will-change: transform to the animated element.'),
    },
    {
      issue_id: webIssueIds[3], author_id: carolId,
      content: doc('Tested on Firefox – animation works but the hero image flickers on load. Might need loading="eager" on that <img>.'),
    },
    // WEB-6 (footer bug)
    {
      issue_id: webIssueIds[5], author_id: carolId,
      content: doc('Confirmed repro. The issue is the flex-wrap not kicking in below 375px. I\'ll add a min-width to the footer columns.'),
    },
    {
      issue_id: webIssueIds[5], author_id: davidId,
      content: doc('Thanks! Also noticed this happens in Chrome on Pixel 4a. So it\'s not just Safari.'),
    },
    // MOB-4 (dashboard)
    {
      issue_id: mobIssueIds[3], author_id: carolId,
      content: doc('Should the activity feed show items from ALL team members or just the current user?'),
    },
    {
      issue_id: mobIssueIds[3], author_id: aliceId,
      content: doc('All team members – we want a shared timeline. Filter will come in a later sprint.'),
    },
    // MOB-3 (crash on Android)
    {
      issue_id: mobIssueIds[2], author_id: bobId,
      content: doc('Fixed and tested on Pixel 6 (Android 12). Added null check before BiometricPrompt.authenticate() call.'),
    },
    {
      issue_id: mobIssueIds[2], author_id: aliceId,
      content: doc('Great catch. Marking as done. We should add a unit test for the null branch.'),
    },
  ]

  // Check if comments already exist for WEB-4
  const { data: existingComments } = await supabase
    .from('comments')
    .select('id')
    .eq('issue_id', webIssueIds[3])
    .limit(1)

  if (existingComments && existingComments.length > 0) {
    ok('comments already exist – skipped')
  } else {
    const { error: cmtErr } = await supabase.from('comments').insert(commentRows)
    if (cmtErr) console.warn('  ⚠  comments insert:', cmtErr.message)
    else ok(`${commentRows.length} comments`)
  }

  // -------------------------------------------------------------------------
  // 13. Time entries
  // -------------------------------------------------------------------------
  console.log('\n⏱  Creating time entries…')
  const timeRows = [
    { issue_id: webIssueIds[0], user_id: aliceId, duration_minutes: 120, description: 'Initial token setup', date: daysAgo(25) },
    { issue_id: webIssueIds[0], user_id: aliceId, duration_minutes: 90,  description: 'Review and refinement', date: daysAgo(24) },
    { issue_id: webIssueIds[1], user_id: bobId,   duration_minutes: 180, description: 'Built all Button variants', date: daysAgo(23) },
    { issue_id: webIssueIds[2], user_id: carolId, duration_minutes: 240, description: 'Navigation + mobile drawer', date: daysAgo(20) },
    { issue_id: webIssueIds[3], user_id: aliceId, duration_minutes: 300, description: 'Hero section markup and styles', date: daysAgo(11) },
    { issue_id: webIssueIds[3], user_id: aliceId, duration_minutes: 150, description: 'Animation and responsive tweaks', date: daysAgo(9) },
    { issue_id: webIssueIds[4], user_id: bobId,   duration_minutes: 210, description: 'Pricing table layout', date: daysAgo(8) },
    { issue_id: webIssueIds[5], user_id: carolId, duration_minutes: 60,  description: 'Bug investigation', date: daysAgo(2) },
    { issue_id: mobIssueIds[0], user_id: aliceId, duration_minutes: 270, description: 'Auth screens + validation', date: daysAgo(18) },
    { issue_id: mobIssueIds[1], user_id: carolId, duration_minutes: 180, description: 'Onboarding carousel animation', date: daysAgo(16) },
    { issue_id: mobIssueIds[2], user_id: bobId,   duration_minutes: 90,  description: 'Crash fix and testing', date: daysAgo(10) },
    { issue_id: mobIssueIds[3], user_id: aliceId, duration_minutes: 360, description: 'Dashboard layout and API integration', date: daysAgo(4) },
    { issue_id: mobIssueIds[5], user_id: bobId,   duration_minutes: 240, description: 'Profile screen + avatar upload', date: daysAgo(3) },
  ]

  const { data: existingTime } = await supabase
    .from('time_entries')
    .select('id')
    .eq('issue_id', webIssueIds[0])
    .limit(1)

  if (existingTime && existingTime.length > 0) {
    ok('time entries already exist – skipped')
  } else {
    const { error: teErr } = await supabase.from('time_entries').insert(timeRows)
    if (teErr) console.warn('  ⚠  time_entries insert:', teErr.message)
    else ok(`${timeRows.length} time entries`)
  }

  // -------------------------------------------------------------------------
  // 14. Activity log
  // -------------------------------------------------------------------------
  console.log('\n📜  Creating activity log…')
  const activityRows = [
    { org_id: org.id, project_id: webProject.id, issue_id: null,           user_id: aliceId, action: 'project.created',    metadata: { project_name: 'Website Redesign' } },
    { org_id: org.id, project_id: webProject.id, issue_id: null,           user_id: aliceId, action: 'sprint.created',     metadata: { sprint_name: 'Sprint 1 – Foundation' } },
    { org_id: org.id, project_id: webProject.id, issue_id: webIssueIds[0], user_id: aliceId, action: 'issue.created',      metadata: { issue_key: 'WEB-1', title: 'Set up Tailwind CSS design tokens' } },
    { org_id: org.id, project_id: webProject.id, issue_id: webIssueIds[5], user_id: carolId, action: 'issue.status_changed', metadata: { issue_key: 'WEB-6', from: 'todo', to: 'in_progress' } },
    { org_id: org.id, project_id: webProject.id, issue_id: webIssueIds[3], user_id: aliceId, action: 'time.logged',        metadata: { issue_key: 'WEB-4', duration_minutes: 300 } },
    { org_id: org.id, project_id: webProject.id, issue_id: null,           user_id: aliceId, action: 'sprint.started',     metadata: { sprint_name: 'Sprint 2 – Core Pages' } },
    { org_id: org.id, project_id: mobProject.id, issue_id: null,           user_id: bobId,   action: 'project.created',    metadata: { project_name: 'Mobile App' } },
    { org_id: org.id, project_id: mobProject.id, issue_id: mobIssueIds[2], user_id: bobId,   action: 'issue.resolved',     metadata: { issue_key: 'MOB-3', title: 'Crash on Android 12 during login' } },
    { org_id: org.id, project_id: mobProject.id, issue_id: mobIssueIds[3], user_id: aliceId, action: 'issue.assigned',     metadata: { issue_key: 'MOB-4', assignee: 'Alice Johnson' } },
    { org_id: org.id, project_id: mobProject.id, issue_id: null,           user_id: bobId,   action: 'sprint.started',     metadata: { sprint_name: 'Sprint 2 – Core Features' } },
  ]

  const { data: existingActivity } = await supabase
    .from('activity_log')
    .select('id')
    .eq('org_id', org.id)
    .limit(1)

  if (existingActivity && existingActivity.length > 0) {
    ok('activity log already exists – skipped')
  } else {
    const { error: actErr } = await supabase.from('activity_log').insert(activityRows)
    if (actErr) console.warn('  ⚠  activity_log insert:', actErr.message)
    else ok(`${activityRows.length} activity events`)
  }

  // -------------------------------------------------------------------------
  // 15. Notifications
  // -------------------------------------------------------------------------
  console.log('\n🔔  Creating notifications…')
  const notifRows = [
    {
      user_id: aliceId, org_id: org.id, type: 'issue_assigned', is_read: false,
      title: 'Issue assigned to you',
      message: 'MOB-4: Home dashboard with activity feed has been assigned to you.',
      link: `/org/acme-corp/projects/${mobProject.id}/issues/${mobIssueIds[3]}`,
    },
    {
      user_id: bobId,   org_id: org.id, type: 'comment',        is_read: false,
      title: 'New comment on WEB-4',
      message: 'Carol Davis: "Tested on Firefox – animation works but the hero image flickers on load."',
      link: `/org/acme-corp/projects/${webProject.id}/issues/${webIssueIds[3]}`,
    },
    {
      user_id: carolId, org_id: org.id, type: 'issue_assigned', is_read: true,
      title: 'Issue assigned to you',
      message: 'WEB-3: Responsive navigation header has been assigned to you.',
      link: `/org/acme-corp/projects/${webProject.id}/issues/${webIssueIds[2]}`,
    },
    {
      user_id: carolId, org_id: org.id, type: 'mention',        is_read: false,
      title: 'You were mentioned',
      message: 'Alice Johnson mentioned you in MOB-4: "Filter will come in a later sprint."',
      link: `/org/acme-corp/projects/${mobProject.id}/issues/${mobIssueIds[3]}`,
    },
    {
      user_id: davidId, org_id: org.id, type: 'sprint_started', is_read: false,
      title: 'Sprint 2 started',
      message: 'Sprint 2 – Core Pages is now active in Website Redesign.',
      link: `/org/acme-corp/projects/${webProject.id}/sprints`,
    },
    {
      user_id: aliceId, org_id: org.id, type: 'issue_resolved', is_read: true,
      title: 'Bug resolved',
      message: 'MOB-3: Crash on Android 12 during login has been resolved by Bob Smith.',
      link: `/org/acme-corp/projects/${mobProject.id}/issues/${mobIssueIds[2]}`,
    },
  ]

  const { data: existingNotifs } = await supabase
    .from('notifications')
    .select('id')
    .eq('org_id', org.id)
    .limit(1)

  if (existingNotifs && existingNotifs.length > 0) {
    ok('notifications already exist – skipped')
  } else {
    const { error: notifErr } = await supabase.from('notifications').insert(notifRows)
    if (notifErr) console.warn('  ⚠  notifications insert:', notifErr.message)
    else ok(`${notifRows.length} notifications`)
  }

  // -------------------------------------------------------------------------
  // Done
  // -------------------------------------------------------------------------
  console.log('\n✅  Seed complete!\n')
  console.log('   Login credentials (all users):')
  console.log('   ──────────────────────────────────────────')
  for (const u of USERS) {
    console.log(`   ${u.full_name.padEnd(16)} ${u.email}`)
  }
  console.log(`   Password: ${USER_PASSWORD}`)
  console.log('   ──────────────────────────────────────────\n')
}

main().catch((err) => {
  console.error('\n💥  Unexpected error:', err)
  process.exit(1)
})
