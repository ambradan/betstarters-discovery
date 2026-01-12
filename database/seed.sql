-- ============================================
-- BETSTARTERS DISCOVERY COCKPIT
-- Seed Data
-- ============================================

-- ============================================
-- USERS
-- work_type is NULL by default - to be set manually
-- ============================================

INSERT INTO users (name, role, pin, slug, market_focus, work_type, location) VALUES
('Marco Zucco', 'owner', '1234', 'marco', NULL, NULL, 'Malta'),
('Glenn Debattista', 'team_member', '2345', 'glenn', 'Africa', NULL, 'Malta'),
('Mauro', 'team_member', '3456', 'mauro', 'Africa', NULL, NULL),
('Anita', 'team_member', '4567', 'anita', 'Argentina', NULL, NULL),
('Gianmarco', 'team_member', '5678', 'gianmarco', 'Argentina', NULL, NULL),
('Ambra', 'consultant', '0000', 'ambra', NULL, NULL, 'Italy');

-- ============================================
-- PROJECT
-- ============================================

INSERT INTO projects (name, current_projects_month, target_projects_month, target_timeline_months, ttd_target) VALUES
('BetStarters', 2, 8, 12, 30);

-- ============================================
-- TASK DEFINITIONS
-- iGaming B2B specific tasks
-- ============================================

INSERT INTO task_definitions (name, category, description) VALUES
-- Sales
('Lead Research & Qualification', 'sales', 'Ricerca e qualificazione nuovi lead'),
('Initial Outreach', 'sales', 'Primo contatto con prospect'),
('Demo Preparation', 'sales', 'Preparazione demo prodotto'),
('Demo/Presentation Delivery', 'sales', 'Esecuzione demo e presentazioni'),
('Proposal Writing', 'sales', 'Stesura proposte commerciali'),
('Contract Negotiation', 'sales', 'Negoziazione contratti'),
('Follow-up Communications', 'sales', 'Follow-up con prospect e clienti'),

-- Operations
('CRM Updates', 'operations', 'Aggiornamento CRM e tracking'),
('Client Onboarding', 'operations', 'Onboarding nuovi clienti'),
('Technical Integration Support', 'operations', 'Supporto integrazioni tecniche'),
('Client Communication', 'operations', 'Comunicazione continua con clienti'),
('Issue Resolution', 'operations', 'Risoluzione problemi e ticket'),

-- Strategy
('Market Research', 'strategy', 'Ricerca mercati e competitor'),
('Compliance Monitoring', 'strategy', 'Monitoraggio requisiti compliance'),
('Regulatory Updates', 'strategy', 'Aggiornamenti normativi per mercato'),

-- Admin
('Reporting & Analytics', 'admin', 'Report e analisi dati'),
('Documentation', 'admin', 'Documentazione processi'),
('Internal Meetings', 'admin', 'Partecipazione meeting interni'),
('Email & Communication', 'admin', 'Gestione email e comunicazioni');

-- ============================================
-- DISCOVERY QUESTIONS
-- ============================================

-- Process questions (CRITICAL)
INSERT INTO discovery_questions (category, text, priority, sort_order) VALUES
('process', 'Quando arriva un nuovo lead, chi lo vede per primo? Cosa fa?', 'critical', 1),
('process', 'Quali step ci sono da "primo contatto" a "contratto firmato"?', 'critical', 2),
('process', 'Quanto tempo passa in media per ogni step? Dove si blocca di più?', 'critical', 3),
('process', 'Quanti lead ricevete al mese? Da quali fonti?', 'critical', 4),
('process', 'Di 100 lead, quanti demo? Quanti proposal? Quanti chiusi?', 'critical', 5),
('process', 'Un "progetto" è: nuovo cliente? Upsell? Nuovo mercato per cliente esistente?', 'critical', 6),

-- KPI questions (CRITICAL)
('kpi', '"Time to Delivery": da quando inizia? (primo contatto? contratto? kickoff?)', 'critical', 7),
('kpi', '"Time to Delivery": quando finisce? (go-live? primo revenue? acceptance?)', 'critical', 8),
('kpi', 'Qual è il TTD medio attuale? (se lo sapete)', 'critical', 9),
('kpi', 'Come definite "progetto completato"?', 'critical', 10),

-- Tools questions (HIGH)
('tools', 'Dove sono i dati dei lead oggi? (CRM, spreadsheet, email?)', 'high', 11),
('tools', 'Come tracciate lo stato di ogni deal?', 'high', 12),
('tools', 'Avete visibilità su pipeline e forecast?', 'high', 13),
('tools', 'Quali tool usate per comunicare internamente?', 'medium', 14),

-- Qualification questions (HIGH)
('qualification', 'Quali mercati sono must-have per voi nei prossimi 6 mesi?', 'high', 15),
('qualification', 'Un prospect senza licenza può essere qualificato?', 'high', 16),
('qualification', 'Quali criteri usate per prioritizzare un lead?', 'high', 17),
('qualification', 'Ci sono deal size minime per procedere?', 'medium', 18),

-- Competitive questions (MEDIUM)
('competitive', 'Contro chi perdete deal più spesso?', 'medium', 19),
('competitive', 'Perché perdete? (prezzo, feature, timing, altro?)', 'medium', 20),
('competitive', 'Qual è il vostro differenziatore principale?', 'medium', 21),

-- Pain points questions (HIGH)
('pain_points', 'Dove perdete più tempo nel processo di vendita?', 'high', 22),
('pain_points', 'Cosa vi fa perdere deal che sembravano chiusi?', 'high', 23),
('pain_points', 'Quali informazioni vi mancano sempre quando ne avete bisogno?', 'high', 24),
('pain_points', 'Cosa vorreste che il team facesse diversamente?', 'medium', 25),

-- Team questions (HIGH)
('team', 'Ogni membro del team ha obiettivi individuali chiari?', 'high', 26),
('team', 'Come viene misurata la performance individuale?', 'high', 27),
('team', 'Ci sono skill gap nel team attuale?', 'medium', 28),
('team', 'Chi decide cosa quando Marco non è disponibile?', 'high', 29),

-- Governance questions (CRITICAL)
('governance', 'Chi è lo sponsor interno del progetto di crescita?', 'critical', 30),
('governance', 'Chi ha autorità per cambiare processi?', 'high', 31),
('governance', 'Come vengono prese le decisioni strategiche?', 'medium', 32),
('governance', 'Ci sono blocchi organizzativi che rallentano tutto?', 'critical', 33),

-- Success criteria (HIGH)
('success', 'Come definiamo successo tra 3 mesi?', 'high', 34),
('success', 'Come definiamo successo tra 12 mesi?', 'high', 35),
('success', 'Quali metriche guarderete per capire se funziona?', 'high', 36),
('success', 'Cosa deve assolutamente NON succedere?', 'medium', 37);

-- ============================================
-- MARKET INTELLIGENCE
-- iGaming markets
-- ============================================

INSERT INTO market_intelligence (code, name, region, status, regulator, summary, cultural, confidence) VALUES
-- LATAM
('BRA', 'Brazil', 'LATAM', 'Regolamentato (2023)', 'SPA-MF', 
 'Regolamentazione federale sotto Legge 14.790. Framework in evoluzione. Licenze dal 2024. Mercato enorme (200M+ popolazione).',
 'PIX dominante per pagamenti. Portoghese. Cultura calcio fortissima. Mobile-first.',
 'high'),

('ARG', 'Argentina', 'LATAM', 'Regolamentato (provinciale)', 'LOTBA / IPLyC', 
 'Licenze provinciali. Buenos Aires più sviluppato (LOTBA). Altre province con regolatori propri. Complessità fiscale.',
 'Spagnolo. Calcio. Crypto popolare per inflazione. Pagamenti locali complessi.',
 'high'),

('MEX', 'Mexico', 'LATAM', 'Grey market', 'SEGOB', 
 'Legge gaming del 1947 in revisione. Online in zona grigia. Alto rischio AML. Riforma attesa ma tempi incerti.',
 'Spagnolo. Mercato grande (130M). OXXO per pagamenti cash. Baseball nel nord.',
 'medium'),

('COL', 'Colombia', 'LATAM', 'Regolamentato', 'Coljuegos', 
 'Regolamentato dal 2016. Coljuegos rilascia licenze. Mercato maturo per LATAM standards.',
 'Spagnolo. PSE per pagamenti. Calcio e ciclismo.',
 'high'),

('PER', 'Peru', 'LATAM', 'Regolamentato', 'MINCETUR', 
 'Regolamentazione recente. Mercato in crescita. Requisiti localizzazione.',
 'Spagnolo. Mobile penetration alta. Calcio.',
 'medium'),

-- AFRICA
('NGA', 'Nigeria', 'Africa', 'Regolamentato', 'NLRC', 
 'Regolamentazione stretta. Licenza richiesta per stato. Lagos principale mercato. NLRC federale + regolatori statali.',
 'Inglese. Mobile money dominante. Popolazione giovane (200M+). Nord religioso più restrittivo.',
 'high'),

('ZAF', 'South Africa', 'Africa', 'Regolamentato', 'NGB', 
 'Sistema avanzato ma enforcement challenging. National Gambling Board supervisiona. Licenze provinciali.',
 'Diverse lingue. Mobile-first. Rugby e cricket oltre calcio.',
 'high'),

('KEN', 'Kenya', 'Africa', 'Regolamentato', 'BCLB', 
 'Betting Control and Licensing Board. Tassazione alta (20% su stake). M-Pesa dominante.',
 'Inglese/Swahili. Mobile money. Calcio UK popolare.',
 'high'),

('GHA', 'Ghana', 'Africa', 'Regolamentato', 'Gaming Commission', 
 'Gaming Commission of Ghana. Mercato in crescita. Mobile money.',
 'Inglese. Calcio. Mobile payments.',
 'medium'),

('TZA', 'Tanzania', 'Africa', 'Regolamentato', 'Gaming Board', 
 'Gaming Board of Tanzania. Tassazione su GGR. Mobile money.',
 'Swahili/Inglese. Mobile dominant.',
 'medium'),

('UGA', 'Uganda', 'Africa', 'Regolamentato', 'National Lotteries Board', 
 'Regolamentazione presente ma enforcement variabile.',
 'Inglese. Mobile money. Calcio.',
 'low'),

('MOZ', 'Mozambique', 'Africa', 'Grey market', 'N/A', 
 'No framework iGaming chiaro. Opportunità ma rischio alto.',
 'Portoghese. Sunday rest day importante. Mobile in crescita.',
 'low'),

-- EUROPE (reference markets)
('MLT', 'Malta', 'Europe', 'Regolamentato', 'MGA', 
 'Malta Gaming Authority. Hub europeo iGaming. Licenze B2B e B2C. Standard alto.',
 'Inglese/Maltese. Business-friendly. Timezone EU.',
 'verified'),

('GBR', 'UK', 'Europe', 'Regolamentato', 'UKGC', 
 'UK Gambling Commission. Regolamentazione più stretta. Affordability checks. Marketing restrictions.',
 'Inglese. Mercato maturo. Compliance intensive.',
 'verified'),

('SWE', 'Sweden', 'Europe', 'Regolamentato', 'Spelinspektionen', 
 'Re-regolamentato 2019. Restrizioni marketing. Spelpaus (self-exclusion).',
 'Svedese. Responsible gambling focus. Inverni lunghi = più gaming.',
 'verified'),

('DNK', 'Denmark', 'Europe', 'Regolamentato', 'Spillemyndigheden', 
 'Danish Gambling Authority. Simile a Svezia. Tassazione su GGR.',
 'Danese. Responsible gambling. Mercato piccolo ma affluente.',
 'verified');

-- ============================================
-- GROWTH OBJECTIVES (initial)
-- ============================================

INSERT INTO growth_objectives (type, title, current_value, target_value, unit, status, confidence) VALUES
('operational', 'Progetti mensili', 2, 8, 'progetti/mese', 'in_progress', 0.5),
('temporal', 'Time to Delivery', 0, 30, 'giorni', 'planned', 0.3),
('economic', 'Revenue mensile', 0, 100000, 'EUR', 'planned', 0.4);
