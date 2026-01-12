# BetStarters Discovery Cockpit

Sistema di discovery interattivo per consulenza B2B iGaming con Speech-to-Text opzionale e analisi semantica.

## 🎯 Features

### Per Ruolo

| Ruolo | Accesso |
|-------|---------|
| **Owner (Marco)** | Dashboard, Area Riservata (budget, margini, note strategiche), Gestione blocchi organizzativi, Edit progetto |
| **Consultant (Ambra)** | **God Mode** - Accesso completo a tutto, inclusi dati owner (sola lettura), Call Mode, STT |
| **Team Member** | Dashboard (read), Proprio profilo (edit), Task personali, Segnalazione blocchi |

### Funzionalità Principali

- **Dashboard** - KPI real-time, gap critici, team overview, blocchi organizzativi
- **Call Mode** - Domande prioritarie, risposte live, STT opzionale
- **Team** - Profili con work_type editabile (fulltime/parttime), task assegnate (max 10), blocchi
- **Markets** - Intelligence regolamentare per mercato iGaming
- **Reports** - Export JSON/PDF
- **Area Riservata** - Dati confidenziali owner + decision log

### Speech-to-Text (Opzionale)

- Checkbox per abilitare/disabilitare
- Web Speech API (browser-based, gratuito)
- Estrazione semantica automatica (TTD, progetti, budget, paesi)
- Rilevamento incertezze ("circa", "forse")
- Suggerimenti AI in tempo reale

## 🚀 Setup

### 1. Supabase

```bash
# Crea progetto su https://supabase.com
# Vai su SQL Editor ed esegui:

# 1. Schema
psql -f database/schema.sql

# 2. Seed data
psql -f database/seed.sql
```

### 2. Environment Variables

Crea `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Install & Run

```bash
npm install
npm run dev
```

Apri http://localhost:3000

### 4. Deploy (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

## 👤 Utenti Default

| Nome | Ruolo | PIN | Accesso |
|------|-------|-----|---------|
| Marco Zucco | Owner | 1234 | Completo + Area Riservata |
| Glenn Debattista | Team | 2345 | Dashboard + Proprio profilo |
| Mauro | Team | 3456 | Dashboard + Proprio profilo |
| Anita | Team | 4567 | Dashboard + Proprio profilo |
| Gianmarco | Team | 5678 | Dashboard + Proprio profilo |
| **Ambra** | **Consultant** | **0000** | **God Mode (tutto)** |

## 📁 Struttura

```
betstarters-selfhost/
├── app.tsx                 # Applicazione React completa
├── package.json
├── database/
│   ├── schema.sql          # Schema Supabase (15 tabelle)
│   └── seed.sql            # Dati iniziali (users, tasks, questions, markets)
├── tests/
│   └── stt.test.js         # Unit tests STT
└── README.md
```

## 🗄️ Database Schema

### Tabelle Principali

| Tabella | Descrizione |
|---------|-------------|
| `users` | Utenti con ruolo, PIN, work_type |
| `projects` | Progetto con KPI e dati owner-only |
| `discovery_questions` | 37 domande discovery con priorità |
| `task_definitions` | 19 task predefinite iGaming |
| `user_tasks` | Task assegnate per utente (max 10) |
| `user_blockers` | Blocchi segnalati dal team |
| `improvement_suggestions` | Suggerimenti miglioramento |
| `market_intelligence` | Intel regolamentare per paese |
| `decisions` | Audit log decisioni |
| `stt_sessions` | Sessioni STT |
| `stt_extractions` | Dati estratti da STT |
| `growth_objectives` | Obiettivi di crescita |
| `ai_insights` | Insight AI generati |

## 🔒 Permessi

```typescript
// God Mode (Consultant)
const isGodMode = currentUser?.role === 'consultant';
// Vede tutto, inclusi dati owner (sola lettura)

// Owner
const canEditProject = currentUser?.role === 'owner';
// Edit progetto, area riservata, gestione blocchi

// Team Member
const canEditOwnProfile = currentUser?.role === 'team_member';
// Edit solo proprio profilo, task, segnala blocchi
```

## 🎤 STT Configuration

Il sistema usa Web Speech API (nativo browser):

- **Chrome/Edge**: ✅ Supportato
- **Safari**: ✅ Supportato (iOS 14.5+)
- **Firefox**: ❌ Non supportato

### Fallback Deepgram (opzionale)

Per qualità professionale, aggiungi Deepgram:

```env
NEXT_PUBLIC_DEEPGRAM_API_KEY=your-key
```

Costo: ~€0.01/minuto

## 📊 Dati Estratti Automaticamente

| Pattern | Campo | Esempio |
|---------|-------|---------|
| `\d+ giorni` | TTD | "45 giorni" → ttd_current: 45 |
| `\d+ progetti` | Target | "5 progetti" → target_projects: 5 |
| `\d+%` | Conversion | "25%" → conversion_rate: 25 |
| `\d+k` / `\d+ mila` | Budget | "50k" → budget: 50000 |
| Nomi paesi | Market alert | "Brasile" → suggerimento verifica |

## 🧪 Testing

```bash
# Run unit tests
npm test

# Output:
# ✅ 36/36 tests passed
```

## 📝 Customizzazione

### Aggiungere Task

```sql
INSERT INTO task_definitions (name, category, description) 
VALUES ('Nuova Task', 'sales', 'Descrizione task');
```

### Aggiungere Domande

```sql
INSERT INTO discovery_questions (category, text, priority, sort_order)
VALUES ('process', 'Nuova domanda?', 'high', 40);
```

### Aggiungere Mercati

```sql
INSERT INTO market_intelligence (code, name, region, status, regulator, summary, cultural, confidence)
VALUES ('XXX', 'Paese', 'Region', 'Status', 'Regulator', 'Summary', 'Cultural notes', 'medium');
```

## 🐛 Troubleshooting

### STT non funziona
- Verifica di usare Chrome/Edge
- Controlla permessi microfono
- HTTPS richiesto in produzione

### Supabase connection error
- Verifica URL e anon key
- Controlla RLS policies
- Verifica che le tabelle esistano

### Login non funziona
- PIN è 4 cifre numeriche
- Verifica che l'utente esista nel database

## 📄 License

Proprietario - BetStarters / Ambra Fioravanti
