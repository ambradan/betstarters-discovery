"use client";

// ============================================
// BETSTARTERS DISCOVERY COCKPIT
// Production-ready for selfhosting
// v1.5 - AI rewrite notes, PDF export, custom tasks
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// ============================================
// SUPABASE CLIENT
// ============================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================
// TYPES
// ============================================

type UserRole = 'owner' | 'team_member' | 'consultant';
type WorkType = 'fulltime' | 'parttime' | null;
type ViewMode = 'dashboard' | 'call' | 'team' | 'markets' | 'reports' | 'settings' | 'owner_private';

interface AppUser {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  slug: string;
  market_focus?: string;
  work_type: WorkType;
  location?: string;
}

interface Project {
  id: string;
  name: string;
  current_projects_month: number;
  target_projects_month: number;
  target_timeline_months: number;
  ttd_current?: number;
  ttd_target?: number;
  budget_total?: number;
  margin_target?: number;
  strategic_notes?: string;
}

interface Question {
  id: string;
  category: string;
  text: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  answered: boolean;
  answer?: string;
  answered_by?: string;
  answered_at?: string;
  mentioned_users?: string[];
}

interface AnswerHistory {
  id: string;
  question_id: string;
  answer: string;
  answered_by: string;
  mentioned_users?: string[];
  source: 'manual' | 'stt' | 'stt_correction';
  created_at: string;
}

interface TaskDefinition {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface UserTask {
  id: string;
  user_id: string;
  task_id: string;
  task_name: string;
  is_custom: boolean;
  created_at: string;
}

interface Blocker {
  id: string;
  user_id: string;
  title: string;
  type: 'process' | 'tool' | 'information' | 'communication' | 'organizational';
  impact: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'reported' | 'acknowledged' | 'in_progress' | 'resolved';
  requires_owner: boolean;
  created_at: string;
}

interface Suggestion {
  id: string;
  user_id: string;
  category: string;
  title: string;
  description: string;
  expected_benefit?: string;
  status: 'submitted' | 'under_review' | 'approved' | 'completed' | 'declined';
  created_at: string;
}

interface TeamNote {
  id: string;
  user_id: string;
  content: string;
  status: 'draft' | 'published';
  published_at?: string;
  created_at: string;
  updated_at: string;
}

interface MarketIntel {
  code: string;
  name: string;
  region: string;
  status: string;
  regulator: string;
  summary: string;
  cultural: string;
  confidence: 'low' | 'medium' | 'high' | 'verified';
  updated_at: string;
}

interface Decision {
  id: string;
  type: string;
  title: string;
  description: string;
  reasoning: string;
  made_by: string;
  created_at: string;
  previous_state?: any;
  new_state?: any;
}

interface STTExtraction {
  id: string;
  session_id: string;
  field: string;
  value: string;
  confidence: 'low' | 'medium' | 'high';
  category: string;
  quote?: string;
  confirmed: boolean;
  created_at: string;
  timestamp?: string;
}

// ============================================
// UI COMPONENTS
// ============================================

const Card = ({ children, className = '', onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => (
  <div 
    className={`bg-slate-800 rounded-lg border border-slate-700 ${onClick ? 'cursor-pointer hover:border-teal-500 transition-all' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }) => {
  const colors = {
    default: 'bg-slate-600 text-slate-200',
    success: 'bg-green-900/50 text-green-300 border border-green-700',
    warning: 'bg-amber-900/50 text-amber-300 border border-amber-700',
    danger: 'bg-red-900/50 text-red-300 border border-red-700',
    info: 'bg-teal-900/50 text-teal-300 border border-teal-700'
  };
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[variant]}`}>{children}</span>;
};

const ProgressBar = ({ value, max }: { value: number; max: number }) => {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
      <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
};

const Button = ({ children, onClick, variant = 'primary', size = 'md', disabled = false, className = '' }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}) => {
  const variants = {
    primary: 'bg-teal-600 hover:bg-teal-500 text-white',
    secondary: 'bg-slate-600 hover:bg-slate-500 text-white',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-700 text-slate-300'
  };
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded font-medium transition-colors flex items-center gap-1 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({ value, onChange, placeholder, type = 'text', className = '', disabled = false }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  type?: string;
  className?: string;
  disabled?: boolean;
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => !disabled && onChange(e.target.value)}
    placeholder={placeholder}
    disabled={disabled}
    className={`w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
  />
);

const TextArea = ({ value, onChange, placeholder, rows = 3, disabled = false }: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) => (
  <textarea
    value={value}
    onChange={(e) => !disabled && onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    disabled={disabled}
    className={`w-full p-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 resize-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
  />
);

const Select = ({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (val: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="w-full p-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-teal-500"
  >
    {placeholder && <option value="">{placeholder}</option>}
    {options.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (val: boolean) => void; label?: string }) => (
  <label className="flex items-center gap-2 cursor-pointer">
    <div 
      className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-teal-600' : 'bg-slate-600'}`}
      onClick={() => onChange(!checked)}
    >
      <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </div>
    {label && <span className="text-sm text-slate-300">{label}</span>}
  </label>
);

// Modal component
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg border border-slate-700 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
};

// ============================================
// ICONS
// ============================================

const Icons = {
  Mic: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  Stop: () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>,
  Save: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Plus: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>,
  Lock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  AlertTriangle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
};

// ============================================
// SEMANTIC ANALYZER
// ============================================

const analyzeTranscript = (text: string) => {
  const extractions: Partial<STTExtraction>[] = [];
  const uncertainties: { topic: string; reason: string; question: string }[] = [];
  const suggestions: { type: string; content: string; priority: string }[] = [];

  // TTD extraction
  const ttdMatch = text.match(/(\d+)\s*(giorni|days)/i);
  if (ttdMatch) {
    const idx = text.indexOf(ttdMatch[0]);
    extractions.push({
      field: 'ttd_current',
      value: ttdMatch[1],
      confidence: 'high',
      category: 'kpi',
      quote: text.substring(Math.max(0, idx - 20), Math.min(text.length, idx + ttdMatch[0].length + 20))
    });
  }

  // Projects extraction
  const projMatch = text.match(/(\d+)\s*(progetti|projects)/i);
  if (projMatch) {
    extractions.push({
      field: 'target_projects',
      value: projMatch[1],
      confidence: 'medium',
      category: 'kpi'
    });
  }

  // Conversion rate
  const convMatch = text.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (convMatch) {
    extractions.push({
      field: 'conversion_rate',
      value: convMatch[1].replace(',', '.'),
      confidence: 'high',
      category: 'kpi'
    });
  }

  // Budget
  const budgetMatch = text.match(/(\d+)\s*(k|K|mila|euro|€)/);
  if (budgetMatch) {
    let val = parseInt(budgetMatch[1]);
    if (budgetMatch[2].toLowerCase() === 'k' || budgetMatch[2] === 'mila') val *= 1000;
    extractions.push({
      field: 'budget',
      value: val.toString(),
      confidence: 'medium',
      category: 'economic'
    });
  }

  // Country detection
  const countries = [
    { patterns: ['brasile', 'brazil'], name: 'Brasile' },
    { patterns: ['argentina'], name: 'Argentina' },
    { patterns: ['messico', 'mexico'], name: 'Messico' },
    { patterns: ['nigeria'], name: 'Nigeria' },
    { patterns: ['africa'], name: 'Africa' },
    { patterns: ['malta'], name: 'Malta' },
    { patterns: ['sud africa', 'south africa'], name: 'Sud Africa' }
  ];
  
  countries.forEach(c => {
    if (c.patterns.some(p => text.toLowerCase().includes(p))) {
      suggestions.push({
        type: 'market',
        content: `📍 Menzionato ${c.name} - verificare requisiti regolatori`,
        priority: 'medium'
      });
    }
  });

  // Uncertainty markers
  const vagueMarkers = ['circa', 'forse', 'più o meno', 'probabilmente', 'penso', 'credo', 'dovrebbe'];
  vagueMarkers.forEach(marker => {
    if (text.toLowerCase().includes(marker)) {
      uncertainties.push({
        topic: 'Dato approssimativo',
        reason: `Usato "${marker}"`,
        question: 'Puoi darmi un numero più preciso?'
      });
    }
  });

  // Decision detection
  const decisionMarkers = ['deciso', 'abbiamo stabilito', 'procediamo con', 'andiamo con'];
  decisionMarkers.forEach(marker => {
    if (text.toLowerCase().includes(marker)) {
      suggestions.push({
        type: 'decision',
        content: '✅ Possibile decisione rilevata - documentare',
        priority: 'high'
      });
    }
  });

  return { extractions, uncertainties, suggestions };
};

// Detect team member mentions in text
const detectMentions = (text: string, users: AppUser[]): string[] => {
  const mentioned: string[] = [];
  const lowerText = text.toLowerCase();
  
  users.forEach(user => {
    const firstName = user.name.split(' ')[0].toLowerCase();
    if (lowerText.includes(firstName)) {
      mentioned.push(user.id);
    }
  });
  
  return mentioned;
};

// ============================================
// MAIN APPLICATION
// ============================================

export default function DiscoveryCockpit() {
  // ==========================================
  // STATE
  // ==========================================
  
  // Auth
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navigation
  const [view, setView] = useState<ViewMode>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data from Supabase
  const [users, setUsers] = useState<AppUser[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [taskDefinitions, setTaskDefinitions] = useState<TaskDefinition[]>([]);
  const [userTasks, setUserTasks] = useState<UserTask[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [markets, setMarkets] = useState<MarketIntel[]>([]);
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [answerHistory, setAnswerHistory] = useState<AnswerHistory[]>([]);
  const [teamNotes, setTeamNotes] = useState<TeamNote[]>([]);

  // UI State
  const [loading, setLoading] = useState(true);
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [viewingQuestionId, setViewingQuestionId] = useState<string | null>(null);
  const [editingAnswerId, setEditingAnswerId] = useState<string | null>(null);
  const [showAnsweredQuestions, setShowAnsweredQuestions] = useState(false);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({}); // Draft per user
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [customTaskDraft, setCustomTaskDraft] = useState<Record<string, string>>({}); // Custom task input

  // STT State
  const [sttEnabled, setSttEnabled] = useState(false);
  const [sttActive, setSttActive] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);
  const [transcripts, setTranscripts] = useState<{ text: string; time: string; confidence: number }[]>([]);
  const [sttExtractions, setSttExtractions] = useState<Partial<STTExtraction>[]>([]);
  const [sttUncertainties, setSttUncertainties] = useState<{ topic: string; reason: string; question: string }[]>([]);
  const [sttSuggestions, setSttSuggestions] = useState<{ type: string; content: string; priority: string }[]>([]);
  const [sttSessionId, setSttSessionId] = useState<string | null>(null); // NEW: track session

  // Refs
  const recognitionRef = useRef<any>(null);
  const bufferRef = useRef<string>('');
  const analysisTimerRef = useRef<any>(null);
  
  // Refs for stale closure fix - these keep current values accessible in callbacks
  const questionsRef = useRef<Question[]>([]);
  const usersRef = useRef<AppUser[]>([]);
  const currentUserRef = useRef<AppUser | null>(null);
  const sttSessionIdRef = useRef<string | null>(null);
  const projectRef = useRef<Project | null>(null);

  // Keep refs in sync with state
  useEffect(() => { questionsRef.current = questions; }, [questions]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { sttSessionIdRef.current = sttSessionId; }, [sttSessionId]);
  useEffect(() => { projectRef.current = project; }, [project]);

  // ==========================================
  // PERMISSIONS
  // ==========================================
  
  const canViewAll = currentUser?.role === 'consultant' || currentUser?.role === 'owner';
  const canViewOwnerData = currentUser?.role === 'owner' || currentUser?.role === 'consultant';
  const canEditProject = currentUser?.role === 'owner';
  const canEditOwnProfile = currentUser?.role === 'team_member';
  const isGodMode = currentUser?.role === 'consultant';

  // ==========================================
  // DATA LOADING
  // ==========================================

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase.from('users').select('*').order('name');
      if (usersData) setUsers(usersData);

      const { data: projectData } = await supabase.from('projects').select('*').single();
      if (projectData) setProject(projectData);

      const { data: questionsData } = await supabase.from('discovery_questions').select('*').order('sort_order');
      if (questionsData) setQuestions(questionsData);

      const { data: tasksData } = await supabase.from('task_definitions').select('*').order('category, name');
      if (tasksData) setTaskDefinitions(tasksData);

      const { data: userTasksData } = await supabase.from('user_tasks').select('*');
      if (userTasksData) setUserTasks(userTasksData);

      const { data: blockersData } = await supabase.from('user_blockers').select('*').order('created_at', { ascending: false });
      if (blockersData) setBlockers(blockersData);

      const { data: suggestionsData } = await supabase.from('improvement_suggestions').select('*').order('created_at', { ascending: false });
      if (suggestionsData) setSuggestions(suggestionsData);

      const { data: marketsData } = await supabase.from('market_intelligence').select('*').order('region, name');
      if (marketsData) setMarkets(marketsData);

      const { data: decisionsData } = await supabase.from('decisions').select('*').order('created_at', { ascending: false });
      if (decisionsData) setDecisions(decisionsData);

      // Load answer history
      const { data: historyData } = await supabase.from('answer_history').select('*').order('created_at', { ascending: false });
      if (historyData) setAnswerHistory(historyData);

      // Load team notes
      const { data: notesData } = await supabase.from('team_notes').select('*').order('created_at', { ascending: false });
      if (notesData) setTeamNotes(notesData);

    } catch (error) {
      console.error('Error loading data:', error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================
  // STT INITIALIZATION (runs once)
  // ==========================================

  const sttActiveRef = useRef(false); // Track active state for callbacks

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSttSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'it-IT';

        recognition.onresult = (event: any) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript;
              const confidence = event.results[i][0].confidence;

              console.log('STT received:', text); // Debug

              setTranscripts(prev => [...prev.slice(-15), {
                text,
                time: new Date().toLocaleTimeString('it-IT'),
                confidence: Math.round(confidence * 100)
              }]);

              bufferRef.current += ' ' + text;

              // Debounced analysis - process after 2 seconds of silence
              if (analysisTimerRef.current) clearTimeout(analysisTimerRef.current);
              analysisTimerRef.current = setTimeout(() => {
                processSTTBuffer();
              }, 2000);
            }
          }
        };

        recognition.onerror = (event: any) => {
          console.warn('STT error:', event.error);
          if (event.error === 'no-speech' && sttActiveRef.current) {
            setTimeout(() => {
              try { recognition.start(); } catch (e) {}
            }, 100);
          }
        };

        recognition.onend = () => {
          console.log('STT ended, active:', sttActiveRef.current); // Debug
          if (sttActiveRef.current) {
            setTimeout(() => {
              try { recognition.start(); } catch (e) {}
            }, 100);
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      recognitionRef.current?.stop();
    };
  }, []); // Empty dependency - only run once

  // Track last answered question for corrections
  const lastAnsweredRef = useRef<{ questionId: string; timestamp: number } | null>(null);

  // Detect correction phrases
  const isCorrection = (text: string): boolean => {
    const correctionPhrases = [
      'no aspetta', 'no in realtà', 'scusa', 'volevo dire', 'mi correggo',
      'no è', 'anzi', 'non è vero', 'sbagliato', 'correzione',
      'no no', 'aspetta aspetta', 'fermati', 'no intendevo'
    ];
    const lowerText = text.toLowerCase();
    return correctionPhrases.some(phrase => lowerText.includes(phrase));
  };

  // Match transcript to questions - find best matching unanswered question
  const findMatchingQuestion = (text: string): Question | null => {
    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/).filter(w => w.length > 3);
    
    let bestMatch: Question | null = null;
    let bestScore = 0;
    
    const unanswered = questionsRef.current.filter(q => !q.answered);
    
    for (const q of unanswered) {
      const questionWords = q.text.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      let score = 0;
      
      // Check keyword overlap
      for (const qWord of questionWords) {
        if (words.some(w => w.includes(qWord) || qWord.includes(w))) {
          score += 1;
        }
      }
      
      // Boost for key terms
      const keyTerms: Record<string, string[]> = {
        'lead': ['lead', 'prospect', 'cliente', 'contatto'],
        'tempo': ['tempo', 'giorni', 'settimane', 'mesi', 'durata', 'ttd'],
        'step': ['step', 'processo', 'fase', 'passaggio'],
        'tool': ['tool', 'strumento', 'crm', 'software'],
        'mercato': ['mercato', 'paese', 'regione', 'africa', 'latam', 'argentina'],
        'chi': ['chi', 'persona', 'team', 'responsabile'],
      };
      
      for (const [key, terms] of Object.entries(keyTerms)) {
        const questionHasTerm = terms.some(t => q.text.toLowerCase().includes(t));
        const textHasTerm = terms.some(t => lowerText.includes(t));
        if (questionHasTerm && textHasTerm) {
          score += 2;
        }
      }
      
      // Normalize by question length
      const normalizedScore = score / Math.max(questionWords.length, 1);
      
      if (normalizedScore > bestScore && normalizedScore > 0.3) {
        bestScore = normalizedScore;
        bestMatch = q;
      }
    }
    
    console.log('Best match score:', bestScore, bestMatch?.text?.substring(0, 50));
    return bestMatch;
  };

  // Save answer history (tracks all changes)
  const saveAnswerHistory = async (questionId: string, answer: string, answeredBy: string, mentionedUsers: string[], source: 'manual' | 'stt' | 'stt_correction') => {
    const { data, error } = await supabase
      .from('answer_history')
      .insert({
        question_id: questionId,
        answer,
        answered_by: answeredBy,
        mentioned_users: mentionedUsers,
        source
      })
      .select()
      .single();

    if (!error && data) {
      setAnswerHistory(prev => [data, ...prev]);
    }
    return data;
  };

  // Smart AI extraction using Claude API (falls back to pattern matching)
  const extractWithAI = async (text: string, questions: Question[], users: AppUser[]): Promise<{
    matchedQuestionId: string | null;
    extractedAnswer: string;
    mentionedUserIds: string[];
    confidence: number;
  }> => {
    try {
      const unanswered = questions.filter(q => !q.answered);
      const teamNames = users.filter(u => u.role === 'team_member').map(u => u.name);

      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Analizza questo testo trascritto da una call di discovery e:
1. Identifica quale domanda sta rispondendo (se presente)
2. Estrai i nomi del team menzionati
3. Valuta la confidenza (0-1)

TESTO TRASCRITTO:
"${text}"

DOMANDE NON ANCORA RISPOSTE:
${unanswered.map((q, i) => `${i + 1}. [ID:${q.id}] ${q.text}`).join('\n')}

NOMI DEL TEAM DA RILEVARE:
${teamNames.join(', ')}

Rispondi SOLO in JSON:
{
  "matched_question_id": "ID della domanda o null",
  "extracted_answer": "la parte rilevante del testo come risposta",
  "mentioned_names": ["nome1", "nome2"],
  "confidence": 0.8,
  "reasoning": "breve spiegazione"
}`
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.content[0]?.text || '';
        
        // Parse JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          // Map names to IDs
          const mentionedIds = (parsed.mentioned_names || [])
            .map((name: string) => users.find(u => u.name.toLowerCase().includes(name.toLowerCase()))?.id)
            .filter(Boolean);

          return {
            matchedQuestionId: parsed.matched_question_id !== 'null' ? parsed.matched_question_id : null,
            extractedAnswer: parsed.extracted_answer || text,
            mentionedUserIds: mentionedIds,
            confidence: parsed.confidence || 0
          };
        }
      }
    } catch (e) {
      console.error('AI extraction failed:', e);
    }

    // Fallback to pattern matching
    const matched = findMatchingQuestion(text);
    const mentions = detectMentions(text, users);
    return {
      matchedQuestionId: matched?.id || null,
      extractedAnswer: text,
      mentionedUserIds: mentions,
      confidence: matched ? 0.5 : 0
    };
  };

  // Process STT buffer and save to database
  const processSTTBuffer = async () => {
    const text = bufferRef.current.trim();
    if (!text || text.length < 10) return; // Ignore very short utterances
    
    bufferRef.current = '';
    console.log('Processing STT buffer:', text);
    
    const analysis = analyzeTranscript(text);

    // === CHECK FOR CORRECTION ===
    if (isCorrection(text) && lastAnsweredRef.current) {
      const timeSinceLastAnswer = Date.now() - lastAnsweredRef.current.timestamp;
      
      // Only allow corrections within 2 minutes of last answer
      if (timeSinceLastAnswer < 120000) {
        const questionId = lastAnsweredRef.current.questionId;
        const question = questionsRef.current.find(q => q.id === questionId);
        
        if (question) {
          console.log('Correction detected for:', question.text);
          
          // Extract the correction (remove correction phrase)
          let correctedText = text;
          const correctionPhrases = ['no aspetta', 'no in realtà', 'scusa', 'volevo dire', 'mi correggo', 'no è', 'anzi'];
          for (const phrase of correctionPhrases) {
            correctedText = correctedText.toLowerCase().replace(phrase, '').trim();
          }
          
          // Detect new mentions
          const mentionedUserIds = detectMentions(correctedText, usersRef.current);
          const mentionedNames = mentionedUserIds.map(id => usersRef.current.find(u => u.id === id)?.name).filter(Boolean);
          
          // Save to history BEFORE updating
          await saveAnswerHistory(questionId, correctedText, currentUserRef.current?.name + ' (STT)', mentionedUserIds, 'stt_correction');
          
          // Update the answer
          const { error } = await supabase
            .from('discovery_questions')
            .update({
              answer: correctedText,
              answered_by: currentUserRef.current?.name + ' (STT - corretto)',
              answered_at: new Date().toISOString(),
              mentioned_users: mentionedUserIds
            })
            .eq('id', questionId);

          if (!error) {
            setQuestions(prev => prev.map(q => 
              q.id === questionId 
                ? { ...q, answer: correctedText, answered_by: currentUserRef.current?.name + ' (STT - corretto)', mentioned_users: mentionedUserIds }
                : q
            ));
            
            setSttSuggestions(prev => [{
              type: 'correction',
              content: `🔄 Risposta CORRETTA: "${correctedText.substring(0, 50)}..."${mentionedNames.length ? ` (ora: ${mentionedNames.join(', ')})` : ''}`,
              priority: 'high'
            }, ...prev].slice(0, 10));
            
            console.log('Corrected answer for:', questionId);
          }
        }
        return; // Don't process as new answer
      }
    }

    // === AUTO-ANSWER QUESTIONS (with AI extraction) ===
    // Try AI extraction first, fall back to pattern matching
    const aiResult = await extractWithAI(text, questionsRef.current, usersRef.current);
    
    const matchedQuestion = aiResult.matchedQuestionId 
      ? questionsRef.current.find(q => q.id === aiResult.matchedQuestionId)
      : findMatchingQuestion(text);
      
    if (matchedQuestion && aiResult.confidence > 0.3) {
      console.log('Matched question:', matchedQuestion.text, 'confidence:', aiResult.confidence);
      
      // Use AI-extracted mentions or fall back to pattern matching
      const mentionedUserIds = aiResult.mentionedUserIds.length > 0 
        ? aiResult.mentionedUserIds 
        : detectMentions(text, usersRef.current);
      const mentionedNames = mentionedUserIds.map(id => usersRef.current.find(u => u.id === id)?.name).filter(Boolean);
      
      // Save to history FIRST (before updating current answer)
      await saveAnswerHistory(
        matchedQuestion.id, 
        aiResult.extractedAnswer, 
        currentUserRef.current?.name || 'STT', 
        mentionedUserIds, 
        'stt'
      );
      
      // Auto-save as answer
      const { error } = await supabase
        .from('discovery_questions')
        .update({
          answered: true,
          answer: aiResult.extractedAnswer,
          answered_by: currentUserRef.current?.name + ' (STT)',
          answered_at: new Date().toISOString(),
          mentioned_users: mentionedUserIds
        })
        .eq('id', matchedQuestion.id);

      if (!error) {
        // Update local state
        setQuestions(prev => prev.map(q => 
          q.id === matchedQuestion.id 
            ? { ...q, answered: true, answer: aiResult.extractedAnswer, answered_by: currentUserRef.current?.name + ' (STT)', mentioned_users: mentionedUserIds }
            : q
        ));
        
        // Track for corrections
        lastAnsweredRef.current = { questionId: matchedQuestion.id, timestamp: Date.now() };
        
        // Show notification
        setSttSuggestions(prev => [{
          type: 'auto_answer',
          content: `✅ Risposta salvata per: "${matchedQuestion.text.substring(0, 50)}..."${mentionedNames.length ? ` (menzionati: ${mentionedNames.join(', ')})` : ''}`,
          priority: 'high'
        }, ...prev].slice(0, 10));
        
        console.log('Auto-answered question:', matchedQuestion.id);
      }
    }

    // === EXTRACT KPIs ===
    if (analysis.extractions.length) {
      setSttExtractions(prev => [...analysis.extractions, ...prev].slice(0, 20));
      
      // Save extractions to database and update project
      for (const e of analysis.extractions) {
        // Save to stt_extractions table
        if (sttSessionIdRef.current) {
          await supabase.from('stt_extractions').insert({
            session_id: sttSessionIdRef.current,
            field: e.field,
            value: e.value,
            confidence: e.confidence,
            category: e.category,
            quote: e.quote,
            confirmed: false
          });
        }

        // Update project KPIs
        if (e.field === 'ttd_current' && e.value) {
          await updateProject({ ttd_current: parseInt(e.value) });
        }
        if (e.field === 'target_projects' && e.value) {
          await updateProject({ target_projects_month: parseInt(e.value) });
        }
        if (e.field === 'budget' && e.value && canEditProject) {
          await updateProject({ budget_total: parseInt(e.value) });
        }
      }
    }

    if (analysis.uncertainties.length) {
      setSttUncertainties(prev => [...analysis.uncertainties, ...prev].slice(0, 10));
    }

    if (analysis.suggestions.length) {
      setSttSuggestions(prev => [...analysis.suggestions, ...prev].slice(0, 10));
    }
  };

  // ==========================================
  // ACTIONS
  // ==========================================

  const handleLogin = async () => {
    const user = users.find(u => u.id === selectedUserId);
    if (!user) {
      setLoginError('Seleziona un utente');
      return;
    }
    if (pin !== user.pin) {
      setLoginError('PIN errato');
      return;
    }
    setCurrentUser(user);
    setIsLoggedIn(true);
    setPin('');
    setLoginError('');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedUserId(null);
    setView('dashboard');
  };

  const updateProject = async (updates: Partial<Project>) => {
    if (!project) return;
    
    const previousState = { ...project };
    const newState = { ...project, ...updates };
    
    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', project.id);

    if (!error) {
      setProject(newState);
      
      // Log decision
      await supabase.from('decisions').insert({
        type: 'project_update',
        title: `Aggiornamento progetto`,
        description: `Modificati: ${Object.keys(updates).join(', ')}`,
        reasoning: 'Aggiornamento da discovery',
        made_by: currentUser?.name || 'Sistema',
        previous_state: previousState,
        new_state: newState
      });
      
      // Reload decisions
      const { data } = await supabase.from('decisions').select('*').order('created_at', { ascending: false });
      if (data) setDecisions(data);
    }
  };

  const updateUser = async (userId: string, updates: Partial<AppUser>) => {
    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, ...updates } : u));
    }
  };

  // ==========================================
  // TEAM NOTES FUNCTIONS
  // ==========================================

  const saveNoteDraft = async (userId: string, content: string) => {
    if (!content.trim()) return;

    const { data, error } = await supabase
      .from('team_notes')
      .insert({
        user_id: userId,
        content: content.trim(),
        status: 'draft'
      })
      .select()
      .single();

    if (!error && data) {
      setTeamNotes(prev => [data, ...prev]);
      setNoteDraft(prev => ({ ...prev, [userId]: '' }));
    }
  };

  const publishNote = async (noteId: string) => {
    const { error } = await supabase
      .from('team_notes')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', noteId);

    if (!error) {
      setTeamNotes(prev => prev.map(n => 
        n.id === noteId 
          ? { ...n, status: 'published', published_at: new Date().toISOString() }
          : n
      ));
    }
  };

  const updateNote = async (noteId: string, content: string) => {
    const { error } = await supabase
      .from('team_notes')
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', noteId);

    if (!error) {
      setTeamNotes(prev => prev.map(n => 
        n.id === noteId 
          ? { ...n, content: content.trim(), updated_at: new Date().toISOString() }
          : n
      ));
      setEditingNoteId(null);
    }
  };

  const deleteNote = async (noteId: string) => {
    const { error } = await supabase
      .from('team_notes')
      .delete()
      .eq('id', noteId);

    if (!error) {
      setTeamNotes(prev => prev.filter(n => n.id !== noteId));
    }
  };

  const [rewritingNoteId, setRewritingNoteId] = useState<string | null>(null);

  const rewriteNote = async (noteId: string) => {
    const note = teamNotes.find(n => n.id === noteId);
    if (!note) {
      alert('Nota non trovata');
      return;
    }

    const noteAuthor = users.find(u => u.id === note.user_id);
    const authorName = noteAuthor?.name || 'la persona';

    setRewritingNoteId(noteId);

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Questa è una nota scritta da ${authorName} su se stesso/a e il suo lavoro. Riscrivila in terza persona, in modo professionale e chiaro.

REGOLE ASSOLUTE:
- Parla di ${authorName} in terza persona (es. "${authorName} si occupa di...")
- NON iniziare con "Ecco", "Di seguito", "La nota riscritta" o simili
- NON aggiungere informazioni non presenti
- NON inventare nulla
- Vai DRITTO al contenuto
- Usa frasi complete e professionali

NOTA ORIGINALE:
"${note.content}"

Scrivi SOLO la nota riscritta, iniziando direttamente con il contenuto.`
          }]
        })
      });

      const data = await response.json();
      const rewritten = data.content?.[0]?.text?.trim();

      if (rewritten) {
        // Update in DB
        const { error } = await supabase
          .from('team_notes')
          .update({
            content: rewritten,
            updated_at: new Date().toISOString()
          })
          .eq('id', noteId);

        if (!error) {
          setTeamNotes(prev => prev.map(n => 
            n.id === noteId 
              ? { ...n, content: rewritten, updated_at: new Date().toISOString() }
              : n
          ));
        }
      }
    } catch (e) {
      console.error('Rewrite error:', e);
      alert('Errore durante la rielaborazione');
    }

    setRewritingNoteId(null);
  };

  const answerQuestion = async (questionId: string) => {
    if (!answerDraft.trim()) return;

    // Detect team mentions in the answer
    const mentionedUsers = detectMentions(answerDraft, users);

    const { error } = await supabase
      .from('discovery_questions')
      .update({
        answered: true,
        answer: answerDraft,
        answered_by: currentUser?.name,
        answered_at: new Date().toISOString(),
        mentioned_users: mentionedUsers
      })
      .eq('id', questionId);

    if (!error) {
      setQuestions(questions.map(q => 
        q.id === questionId 
          ? { ...q, answered: true, answer: answerDraft, answered_by: currentUser?.name, mentioned_users: mentionedUsers }
          : q
      ));
      setAnswerDraft('');
      setActiveQuestionId(null);
    }
  };

  // NEW: Update existing answer
  const updateAnswer = async (questionId: string, newAnswer: string) => {
    if (!newAnswer.trim()) return;

    const mentionedUsers = detectMentions(newAnswer, users);

    const { error } = await supabase
      .from('discovery_questions')
      .update({
        answer: newAnswer,
        answered_by: currentUser?.name,
        answered_at: new Date().toISOString(),
        mentioned_users: mentionedUsers
      })
      .eq('id', questionId);

    if (!error) {
      setQuestions(questions.map(q => 
        q.id === questionId 
          ? { ...q, answer: newAnswer, answered_by: currentUser?.name, mentioned_users: mentionedUsers }
          : q
      ));
      setEditingAnswerId(null);
      setAnswerDraft('');
    }
  };

  // NEW: Delete answer (reset question to unanswered)
  const deleteAnswer = async (questionId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa risposta?')) return;

    const { error } = await supabase
      .from('discovery_questions')
      .update({
        answered: false,
        answer: null,
        answered_by: null,
        answered_at: null,
        mentioned_users: null
      })
      .eq('id', questionId);

    if (!error) {
      setQuestions(questions.map(q => 
        q.id === questionId 
          ? { ...q, answered: false, answer: undefined, answered_by: undefined, answered_at: undefined, mentioned_users: undefined }
          : q
      ));
      setViewingQuestionId(null);
    }
  };

  const addUserTask = async (userId: string, taskId: string, taskName: string, isCustom: boolean = false) => {
    const existing = userTasks.filter(t => t.user_id === userId);
    if (existing.length >= 10) {
      alert('Massimo 10 task per utente');
      return;
    }

    const { data, error } = await supabase
      .from('user_tasks')
      .insert({ user_id: userId, task_id: taskId, task_name: taskName, is_custom: isCustom })
      .select()
      .single();

    if (!error && data) {
      setUserTasks([...userTasks, data]);
    }
  };

  const removeUserTask = async (taskId: string) => {
    const { error } = await supabase.from('user_tasks').delete().eq('id', taskId);
    if (!error) {
      setUserTasks(userTasks.filter(t => t.id !== taskId));
    }
  };

  const addBlocker = async (userId: string, blocker: Omit<Blocker, 'id' | 'user_id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('user_blockers')
      .insert({ ...blocker, user_id: userId })
      .select()
      .single();

    if (!error && data) {
      setBlockers([data, ...blockers]);
    }
  };

  const updateBlockerStatus = async (blockerId: string, status: Blocker['status']) => {
    const { error } = await supabase
      .from('user_blockers')
      .update({ status })
      .eq('id', blockerId);

    if (!error) {
      setBlockers(blockers.map(b => b.id === blockerId ? { ...b, status } : b));
    }
  };

  const startSTTSession = async () => {
    // Create session in database
    const { data, error } = await supabase
      .from('stt_sessions')
      .insert({
        project_id: project?.id,
        started_by: currentUser?.id
      })
      .select()
      .single();

    if (!error && data) {
      setSttSessionId(data.id);
    }

    setTranscripts([]);
    setSttExtractions([]);
    setSttUncertainties([]);
    setSttSuggestions([]);
    
    try {
      sttActiveRef.current = true; // Set ref BEFORE starting
      recognitionRef.current?.start();
      setSttActive(true);
      console.log('STT started'); // Debug
    } catch (e) {
      console.error('Failed to start STT:', e);
      sttActiveRef.current = false;
    }
  };

  const stopSTTSession = async () => {
    sttActiveRef.current = false; // Set ref BEFORE stopping
    recognitionRef.current?.stop();
    setSttActive(false);
    console.log('STT stopped'); // Debug

    // Update session in database
    if (sttSessionId) {
      await supabase
        .from('stt_sessions')
        .update({
          ended_at: new Date().toISOString(),
          transcript_count: transcripts.length,
          extraction_count: sttExtractions.length
        })
        .eq('id', sttSessionId);
    }

    setSttSessionId(null);
  };

  const toggleSTT = () => {
    if (sttActive) {
      stopSTTSession();
    } else {
      startSTTSession();
    }
  };

  // ==========================================
  // COMPUTED VALUES
  // ==========================================

  const answeredQuestions = questions.filter(q => q.answered);
  const unansweredQuestions = questions.filter(q => !q.answered);
  const criticalGaps = unansweredQuestions.filter(q => q.priority === 'critical');
  const highGaps = unansweredQuestions.filter(q => q.priority === 'high');

  const teamMembers = users.filter(u => u.role === 'team_member');
  const organizationalBlockers = blockers.filter(b => b.requires_owner && b.status !== 'resolved');

  // Get questions that mention a specific user
  const getQuestionsAboutUser = (userId: string) => {
    return questions.filter(q => q.mentioned_users?.includes(userId));
  };

  // Get answer history entries that mention a specific user (shows all changes over time)
  const getAnswerHistoryForUser = (userId: string) => {
    return answerHistory.filter(h => h.mentioned_users?.includes(userId));
  };

  // Get full history for a question (shows all versions)
  const getQuestionHistory = (questionId: string) => {
    return answerHistory.filter(h => h.question_id === questionId).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  // ==========================================
  // PDF EXPORT FUNCTION
  // ==========================================

  const exportToPDF = () => {
    const today = new Date().toLocaleDateString('it-IT');
    const categories = Array.from(new Set(questions.map(q => q.category)));
    
    // Build HTML content
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>BetStarters Discovery Report - ${today}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; line-height: 1.4; color: #1e293b; padding: 20px; }
          h1 { font-size: 20px; color: #0d9488; margin-bottom: 5px; }
          h2 { font-size: 14px; color: #0d9488; margin: 20px 0 10px; padding-bottom: 5px; border-bottom: 2px solid #0d9488; }
          h3 { font-size: 12px; color: #334155; margin: 15px 0 8px; }
          .header { border-bottom: 3px solid #0d9488; padding-bottom: 15px; margin-bottom: 20px; }
          .meta { color: #64748b; font-size: 10px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 15px 0; }
          .kpi { background: #f1f5f9; padding: 10px; border-radius: 5px; text-align: center; }
          .kpi-value { font-size: 18px; font-weight: bold; color: #0d9488; }
          .kpi-label { font-size: 9px; color: #64748b; text-transform: uppercase; }
          .section { margin: 20px 0; page-break-inside: avoid; }
          .question { background: #f8fafc; padding: 8px; margin: 5px 0; border-left: 3px solid #0d9488; }
          .question.critical { border-left-color: #dc2626; background: #fef2f2; }
          .question.unanswered { border-left-color: #f59e0b; background: #fffbeb; }
          .answer { color: #059669; margin-top: 5px; }
          .no-answer { color: #dc2626; font-style: italic; }
          .badge { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 9px; margin-left: 5px; }
          .badge-critical { background: #fecaca; color: #991b1b; }
          .badge-high { background: #fed7aa; color: #9a3412; }
          .badge-medium { background: #fef3c7; color: #92400e; }
          .member-card { background: #f8fafc; padding: 12px; margin: 10px 0; border-radius: 5px; border: 1px solid #e2e8f0; }
          .member-name { font-size: 13px; font-weight: bold; color: #1e293b; }
          .member-meta { color: #64748b; font-size: 10px; margin-bottom: 8px; }
          .task-list { display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0; }
          .task { background: #e2e8f0; padding: 3px 8px; border-radius: 3px; font-size: 9px; }
          .task.custom { background: #ccfbf1; }
          .note { background: #f0fdfa; padding: 8px; margin: 5px 0; border-left: 3px solid #14b8a6; font-size: 10px; }
          .blocker { background: #fef2f2; padding: 8px; margin: 5px 0; border-left: 3px solid #dc2626; }
          .mention { background: #dbeafe; padding: 8px; margin: 5px 0; border-left: 3px solid #3b82f6; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; font-size: 10px; }
          th, td { padding: 6px; text-align: left; border: 1px solid #e2e8f0; }
          th { background: #0d9488; color: white; }
          tr:nth-child(even) { background: #f8fafc; }
          .page-break { page-break-before: always; }
          .footer { margin-top: 30px; padding-top: 10px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 9px; text-align: center; }
          @media print { body { padding: 0; } .page-break { page-break-before: always; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎯 BetStarters Discovery Report</h1>
          <p class="meta">Generato il ${today} • Progetto: ${project?.name || 'BetStarters'}</p>
        </div>

        <!-- KPI Summary -->
        <div class="kpi-grid">
          <div class="kpi">
            <div class="kpi-value">${project?.current_projects_month || 0}/${project?.target_projects_month || 8}</div>
            <div class="kpi-label">Progetti/Mese</div>
          </div>
          <div class="kpi">
            <div class="kpi-value">${project?.ttd_current || '—'}/${project?.ttd_target || 30}</div>
            <div class="kpi-label">TTD (giorni)</div>
          </div>
          <div class="kpi">
            <div class="kpi-value">${answeredQuestions.length}/${questions.length}</div>
            <div class="kpi-label">Discovery</div>
          </div>
          <div class="kpi">
            <div class="kpi-value">${criticalGaps.length}</div>
            <div class="kpi-label">Gap Critici</div>
          </div>
        </div>
    `;

    // Discovery Questions by Category
    html += `<h2>📋 Discovery Questions</h2>`;
    categories.forEach(cat => {
      const catQuestions = questions.filter(q => q.category === cat);
      const answered = catQuestions.filter(q => q.answered).length;
      html += `
        <h3>${cat} (${answered}/${catQuestions.length})</h3>
      `;
      catQuestions.forEach(q => {
        const priorityBadge = q.priority === 'critical' ? '<span class="badge badge-critical">CRITICAL</span>' :
                             q.priority === 'high' ? '<span class="badge badge-high">HIGH</span>' : '';
        const className = q.priority === 'critical' && !q.answered ? 'question critical' : 
                         !q.answered ? 'question unanswered' : 'question';
        html += `
          <div class="${className}">
            <strong>${q.text}</strong> ${priorityBadge}
            ${q.answered 
              ? `<div class="answer">✓ ${q.answer}${q.mentioned_users?.length ? ` <em>(👥 ${q.mentioned_users.map(id => users.find(u => u.id === id)?.name).filter(Boolean).join(', ')})</em>` : ''}</div>` 
              : '<div class="no-answer">⚠ Non risposta</div>'}
          </div>
        `;
      });
    });

    // Team Members Section
    html += `<h2 class="page-break">👥 Team Members</h2>`;
    teamMembers.forEach(member => {
      const memberTasks = userTasks.filter(t => t.user_id === member.id);
      const memberBlockers = blockers.filter(b => b.user_id === member.id);
      const memberMentions = getQuestionsAboutUser(member.id);
      const memberNotes = teamNotes.filter(n => n.user_id === member.id && n.status === 'published');
      const memberHistory = getAnswerHistoryForUser(member.id);

      html += `
        <div class="member-card">
          <div class="member-name">${member.name}</div>
          <div class="member-meta">
            ${member.market_focus || '—'} • ${member.work_type || 'N/A'} • ${member.role}
          </div>
          
          ${memberTasks.length > 0 ? `
            <h4 style="font-size: 10px; margin-top: 8px;">📋 Task (${memberTasks.length})</h4>
            <div class="task-list">
              ${memberTasks.map(t => `<span class="task${t.is_custom ? ' custom' : ''}">${t.is_custom ? '✏️ ' : ''}${t.task_name}</span>`).join('')}
            </div>
          ` : ''}

          ${memberMentions.length > 0 ? `
            <h4 style="font-size: 10px; margin-top: 8px;">💬 Menzionato in (${memberMentions.length})</h4>
            ${memberMentions.slice(0, 5).map(q => `
              <div class="mention">
                <strong>${q.text}</strong><br/>
                <em>${q.answer?.substring(0, 100)}${(q.answer?.length || 0) > 100 ? '...' : ''}</em>
              </div>
            `).join('')}
            ${memberMentions.length > 5 ? `<p style="color: #64748b; font-size: 9px;">+${memberMentions.length - 5} altre menzioni</p>` : ''}
          ` : ''}

          ${memberNotes.length > 0 ? `
            <h4 style="font-size: 10px; margin-top: 8px;">📝 Note pubblicate (${memberNotes.length})</h4>
            ${memberNotes.map(n => `
              <div class="note">
                ${n.content}
                <br/><span style="color: #64748b;">${n.published_at ? new Date(n.published_at).toLocaleDateString('it-IT') : ''}</span>
              </div>
            `).join('')}
          ` : ''}

          ${memberBlockers.length > 0 ? `
            <h4 style="font-size: 10px; margin-top: 8px;">🚨 Blockers (${memberBlockers.length})</h4>
            ${memberBlockers.map(b => `
              <div class="blocker">
                <strong>${b.title}</strong> - ${b.status}
                ${b.description ? `<br/><em>${b.description}</em>` : ''}
              </div>
            `).join('')}
          ` : ''}

          ${memberHistory.length > 0 ? `
            <h4 style="font-size: 10px; margin-top: 8px;">🕐 Storico menzioni (${memberHistory.length})</h4>
            <table>
              <tr><th>Data</th><th>Fonte</th><th>Risposta</th></tr>
              ${memberHistory.slice(0, 10).map(h => {
                const q = questions.find(qu => qu.id === h.question_id);
                return `<tr>
                  <td>${new Date(h.created_at).toLocaleDateString('it-IT')}</td>
                  <td>${h.source === 'stt' ? '🎤 STT' : h.source === 'stt_correction' ? '🔄 Corr' : '✏️ Man'}</td>
                  <td>${h.answer.substring(0, 80)}${h.answer.length > 80 ? '...' : ''}</td>
                </tr>`;
              }).join('')}
            </table>
          ` : ''}
        </div>
      `;
    });

    // Blockers Summary
    const openBlockers = blockers.filter(b => b.status !== 'resolved');
    if (openBlockers.length > 0) {
      html += `
        <h2>🚨 Blockers Aperti (${openBlockers.length})</h2>
        <table>
          <tr><th>Titolo</th><th>Tipo</th><th>Impatto</th><th>Status</th><th>Segnalato da</th></tr>
          ${openBlockers.map(b => {
            const reporter = users.find(u => u.id === b.user_id);
            return `<tr>
              <td>${b.title}</td>
              <td>${b.type}</td>
              <td>${b.impact}</td>
              <td>${b.status}</td>
              <td>${reporter?.name || '—'}</td>
            </tr>`;
          }).join('')}
        </table>
      `;
    }

    // STT Sessions Summary
    if (sttExtractions.length > 0) {
      html += `
        <h2>🎤 Dati STT Estratti (${sttExtractions.length})</h2>
        <table>
          <tr><th>Data</th><th>Confidence</th><th>Estrazione</th></tr>
          ${sttExtractions.slice(0, 20).map(e => `
            <tr>
              <td>${e.timestamp || '—'}</td>
              <td>${e.confidence || '—'}</td>
              <td>${JSON.stringify(e).substring(0, 100)}...</td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    // Footer
    html += `
        <div class="footer">
          BetStarters Discovery Cockpit • Report generato automaticamente • ${today}
        </div>
      </body>
      </html>
    `;

    // Open print window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // ==========================================
  // LOGIN SCREEN
  // ==========================================

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="p-6 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">🎯 BetStarters Discovery</h1>
            <p className="text-slate-400 text-sm mt-1">Seleziona utente e inserisci PIN</p>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            {users.map(u => (
              <button
                key={u.id}
                onClick={() => { setSelectedUserId(u.id); setLoginError(''); }}
                className={`p-3 rounded-lg border transition-all text-left ${
                  selectedUserId === u.id
                    ? 'border-teal-500 bg-teal-900/30'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
                    u.role === 'owner' ? 'bg-amber-600' :
                    u.role === 'consultant' ? 'bg-teal-600' : 'bg-slate-600'
                  }`}>
                    {u.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">
                      {u.role === 'owner' ? '👑 Owner' : 
                       u.role === 'consultant' ? '🔮 Consultant' : 
                       `📍 ${u.market_focus || 'Team'}`}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedUserId && (
            <div className="space-y-3">
              <input
                type="password"
                maxLength={4}
                placeholder="PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full p-3 bg-slate-700 border border-slate-600 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:border-teal-500"
              />
              {loginError && <p className="text-red-400 text-sm text-center">{loginError}</p>}
              <Button onClick={handleLogin} className="w-full justify-center">
                Accedi
              </Button>
            </div>
          )}
        </Card>
      </div>
    );
  }

  // ==========================================
  // MAIN INTERFACE
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* ========== SIDEBAR ========== */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-56'} bg-slate-800 border-r border-slate-700 flex flex-col transition-all`}>
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            {!sidebarCollapsed && <span className="font-bold text-white">Discovery</span>}
          </div>
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-slate-400 hover:text-white"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {[
            { id: 'dashboard', icon: '📊', label: 'Dashboard', show: true },
            { id: 'call', icon: '📞', label: 'Call Mode', show: canViewAll },
            { id: 'team', icon: '👥', label: 'Team', show: true },
            { id: 'markets', icon: '🌍', label: 'Markets', show: canViewAll },
            { id: 'reports', icon: '📄', label: 'Reports', show: canViewAll },
            { id: 'owner_private', icon: '🔒', label: 'Area Riservata', show: canViewOwnerData },
            { id: 'settings', icon: '⚙️', label: 'Settings', show: true },
          ].filter(item => item.show).map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id as ViewMode)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                view === item.id 
                  ? 'bg-teal-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              {!sidebarCollapsed && <span className="text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              currentUser?.role === 'owner' ? 'bg-amber-600' :
              currentUser?.role === 'consultant' ? 'bg-teal-600' : 'bg-slate-600'
            }`}>
              {currentUser?.name.charAt(0)}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{currentUser?.name}</p>
                <p className="text-xs text-slate-400">
                  {currentUser?.role === 'consultant' ? '🔮 God Mode' : currentUser?.role}
                </p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button 
              onClick={handleLogout}
              className="mt-2 text-xs text-slate-500 hover:text-white w-full text-left"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* ========== MAIN CONTENT ========== */}
      <div className="flex-1 p-6 overflow-auto">
        
        {/* ========== DASHBOARD ========== */}
        {view === 'dashboard' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📊 Dashboard</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="p-4">
                <p className="text-xs text-slate-400 uppercase">Progetti/mese</p>
                <p className="text-3xl font-bold text-white mt-1">{project?.current_projects_month || 0}</p>
                <p className="text-sm text-slate-400">target: {project?.target_projects_month || 0}</p>
                <div className="mt-2">
                  <ProgressBar value={project?.current_projects_month || 0} max={project?.target_projects_month || 1} />
                </div>
              </Card>

              <Card className="p-4">
                <p className="text-xs text-slate-400 uppercase">TTD (giorni)</p>
                <p className="text-3xl font-bold text-white mt-1">{project?.ttd_current || '—'}</p>
                <p className="text-sm text-slate-400">target: {project?.ttd_target || 30}</p>
              </Card>

              <Card className="p-4">
                <p className="text-xs text-slate-400 uppercase">Discovery</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {questions.length > 0 ? Math.round((answeredQuestions.length / questions.length) * 100) : 0}%
                </p>
                <p className="text-sm text-slate-400">{answeredQuestions.length}/{questions.length}</p>
                <div className="mt-2">
                  <ProgressBar value={answeredQuestions.length} max={questions.length} />
                </div>
              </Card>

              <Card className={`p-4 ${criticalGaps.length > 0 ? 'border-red-700' : ''}`}>
                <p className="text-xs text-slate-400 uppercase">Gap Critici</p>
                <p className={`text-3xl font-bold mt-1 ${criticalGaps.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {criticalGaps.length}
                </p>
                <p className="text-sm text-slate-400">da risolvere</p>
              </Card>
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Team Overview */}
              <Card className="p-4">
                <h3 className="font-semibold text-white mb-4">👥 Team</h3>
                <div className="space-y-2">
                  {teamMembers.map(member => {
                    const memberTasks = userTasks.filter(t => t.user_id === member.id);
                    const memberBlockers = blockers.filter(b => b.user_id === member.id && b.status !== 'resolved');
                    const memberMentions = getQuestionsAboutUser(member.id);
                    const memberNotes = teamNotes.filter(n => n.user_id === member.id && n.status === 'published');
                    
                    return (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-2 bg-slate-700/50 rounded hover:bg-slate-600/50 cursor-pointer transition-colors"
                        onClick={() => {
                          setEditingUserId(member.id);
                          setView('team');
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm text-white">{member.name}</p>
                            <p className="text-xs text-slate-400">
                              {member.market_focus || '—'} 
                              {member.work_type && ` • ${member.work_type}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{memberTasks.length} task</span>
                          {memberMentions.length > 0 && (
                            <Badge variant="info">{memberMentions.length} menzioni</Badge>
                          )}
                          {memberNotes.length > 0 && (
                            <Badge variant="success">{memberNotes.length} 📝</Badge>
                          )}
                          {memberBlockers.length > 0 && (
                            <Badge variant="danger">{memberBlockers.length} blocchi</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Critical Gaps */}
              <Card className="p-4">
                <h3 className="font-semibold text-white mb-4">⚠️ Gap Critici</h3>
                {criticalGaps.length === 0 ? (
                  <p className="text-green-400 text-sm">✓ Nessun gap critico</p>
                ) : (
                  <div className="space-y-2">
                    {criticalGaps.slice(0, 5).map(q => (
                      <div 
                        key={q.id} 
                        className="p-2 bg-red-900/20 border-l-2 border-red-500 rounded-r hover:bg-red-900/30 cursor-pointer transition-colors"
                        onClick={() => {
                          setActiveQuestionId(q.id);
                          setView('call');
                        }}
                      >
                        <p className="text-sm text-red-200">{q.text}</p>
                      </div>
                    ))}
                    {criticalGaps.length > 5 && (
                      <p className="text-xs text-slate-400">+{criticalGaps.length - 5} altri</p>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Organizational Blockers */}
            {canViewOwnerData && organizationalBlockers.length > 0 && (
              <Card className="p-4 border-amber-700">
                <h3 className="font-semibold text-amber-400 mb-4">🚨 Blocchi Organizzativi</h3>
                <div className="space-y-2">
                  {organizationalBlockers.map(b => {
                    const reporter = users.find(u => u.id === b.user_id);
                    return (
                      <div key={b.id} className="p-3 bg-amber-900/20 rounded flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium">{b.title}</p>
                          <p className="text-sm text-slate-400">{b.description}</p>
                          <p className="text-xs text-slate-500 mt-1">Segnalato da: {reporter?.name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={b.impact === 'critical' ? 'danger' : b.impact === 'high' ? 'warning' : 'default'}>
                            {b.impact}
                          </Badge>
                          {canEditProject && (
                            <Select
                              value={b.status}
                              onChange={(val) => updateBlockerStatus(b.id, val as Blocker['status'])}
                              options={[
                                { value: 'reported', label: 'Segnalato' },
                                { value: 'acknowledged', label: 'Preso in carico' },
                                { value: 'in_progress', label: 'In lavorazione' },
                                { value: 'resolved', label: 'Risolto' }
                              ]}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Team Notes - Published */}
            {(() => {
              const publishedNotes = teamNotes.filter(n => n.status === 'published');
              if (publishedNotes.length === 0) return null;
              
              return (
                <Card className="p-4 border-teal-700">
                  <h3 className="font-semibold text-teal-400 mb-4">📝 Note del Team</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {publishedNotes.slice(0, 6).map(note => {
                      const author = users.find(u => u.id === note.user_id);
                      return (
                        <div 
                          key={note.id} 
                          className="p-3 bg-teal-900/20 rounded border-l-2 border-teal-500 hover:bg-teal-900/30 cursor-pointer transition-colors"
                          onClick={() => {
                            if (author) {
                              setEditingUserId(author.id);
                              setView('team');
                            }
                          }}
                        >
                          <p className="text-sm text-teal-200">{note.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-slate-400">
                              {author?.name} • {note.published_at && new Date(note.published_at).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {publishedNotes.length > 6 && (
                    <button 
                      className="text-xs text-teal-400 mt-3 text-center w-full hover:underline"
                      onClick={() => setView('team')}
                    >
                      +{publishedNotes.length - 6} altre note • Vai su Team per vedere tutto →
                    </button>
                  )}
                </Card>
              );
            })()}
          </div>
        )}

        {/* ========== CALL MODE ========== */}
        {view === 'call' && canViewAll && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">📞 Call Mode</h2>
                <p className="text-slate-400">{unansweredQuestions.length} domande rimanenti</p>
              </div>
              <div className="flex items-center gap-4">
                <Toggle checked={sttEnabled} onChange={setSttEnabled} label="Abilita STT" />
                <Badge variant="success">● Live</Badge>
              </div>
            </div>

            {/* STT Panel */}
            {sttEnabled && (
              <Card className={`p-4 ${sttActive ? 'border-red-500 bg-red-900/10' : 'border-teal-700'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={toggleSTT}
                      disabled={!sttSupported}
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                        sttActive 
                          ? 'bg-red-600 hover:bg-red-500 animate-pulse' 
                          : 'bg-teal-600 hover:bg-teal-500'
                      } ${!sttSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {sttActive ? <Icons.Stop /> : <Icons.Mic />}
                    </button>
                    <div>
                      <p className="text-white font-medium">
                        {!sttSupported ? '⚠️ STT non supportato (usa Chrome)' :
                         sttActive ? '🔴 In ascolto... (salva automaticamente su DB)' : 'STT Pronto'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {sttSupported ? 'Web Speech API • Dati salvati su Supabase' : 'Usa Chrome o Edge'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-slate-400">
                    <p>Trascrizioni: {transcripts.length}</p>
                    <p>Dati estratti: {sttExtractions.length}</p>
                  </div>
                </div>

                {/* Live transcript */}
                {sttActive && transcripts.length > 0 && (
                  <div className="mt-3 p-2 bg-slate-900/50 rounded max-h-24 overflow-y-auto">
                    {transcripts.slice(-3).map((t, i) => (
                      <p key={i} className="text-sm text-slate-300">
                        <span className="text-slate-500 text-xs">{t.time}</span> {t.text}
                        <span className="text-slate-500 text-xs ml-2">({t.confidence}%)</span>
                      </p>
                    ))}
                  </div>
                )}

                {/* Extractions */}
                {sttExtractions.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {sttExtractions.slice(0, 6).map((e, i) => (
                      <Badge key={i} variant={e.confidence === 'high' ? 'success' : 'warning'}>
                        {e.field}: {e.value} ✓
                      </Badge>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Question stats - CLICKABLE */}
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-red-900/30 border border-red-800 rounded p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{criticalGaps.length}</p>
                <p className="text-xs text-red-300">Critiche</p>
              </div>
              <div className="bg-amber-900/30 border border-amber-800 rounded p-3 text-center">
                <p className="text-2xl font-bold text-amber-400">{highGaps.length}</p>
                <p className="text-xs text-amber-300">Alte</p>
              </div>
              <div className="bg-blue-900/30 border border-blue-800 rounded p-3 text-center">
                <p className="text-2xl font-bold text-blue-400">
                  {unansweredQuestions.filter(q => q.priority === 'medium').length}
                </p>
                <p className="text-xs text-blue-300">Medie</p>
              </div>
              <div 
                className="bg-green-900/30 border border-green-800 rounded p-3 text-center cursor-pointer hover:bg-green-900/50 transition-colors"
                onClick={() => setShowAnsweredQuestions(!showAnsweredQuestions)}
              >
                <p className="text-2xl font-bold text-green-400">{answeredQuestions.length}</p>
                <p className="text-xs text-green-300">Completate {showAnsweredQuestions ? '▼' : '▶'}</p>
              </div>
            </div>

            {/* ANSWERED QUESTIONS - NEW */}
            {showAnsweredQuestions && answeredQuestions.length > 0 && (
              <Card className="p-4 border-green-700">
                <h3 className="font-semibold text-green-400 mb-4">✅ Domande Completate (click per vedere/modificare)</h3>
                <div className="space-y-2">
                  {answeredQuestions.map(q => (
                    <div key={q.id}>
                      <div
                        onClick={() => setViewingQuestionId(viewingQuestionId === q.id ? null : q.id)}
                        className="p-3 rounded border-l-4 border-green-500 bg-green-900/20 cursor-pointer hover:bg-green-900/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="success">completata</Badge>
                            <span className="text-xs text-slate-500">{q.category}</span>
                          </div>
                          {viewingQuestionId === q.id ? <Icons.ChevronDown /> : <Icons.ChevronRight />}
                        </div>
                        <p className="text-sm text-slate-200 mt-2">{q.text}</p>
                      </div>

                      {/* View/Edit Answer */}
                      {viewingQuestionId === q.id && (
                        <div className="mt-2 p-3 bg-slate-900/50 rounded border border-slate-700">
                          <p className="text-xs text-slate-400 mb-2">
                            Risposto da {q.answered_by} • {q.answered_at ? new Date(q.answered_at).toLocaleString('it-IT') : ''}
                          </p>
                          
                          {editingAnswerId === q.id ? (
                            <>
                              <TextArea
                                value={answerDraft}
                                onChange={setAnswerDraft}
                                placeholder="Modifica risposta..."
                                rows={3}
                              />
                              <div className="flex gap-2 mt-2">
                                <Button size="sm" onClick={() => updateAnswer(q.id, answerDraft)}>
                                  <Icons.Save /> Salva
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => { setEditingAnswerId(null); setAnswerDraft(''); }}>
                                  Annulla
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-slate-300 bg-slate-800 p-2 rounded">{q.answer}</p>
                              {q.mentioned_users && q.mentioned_users.length > 0 && (
                                <p className="text-xs text-teal-400 mt-2">
                                  👥 Menzionati: {q.mentioned_users.map(uid => users.find(u => u.id === uid)?.name).filter(Boolean).join(', ')}
                                </p>
                              )}
                              
                              {/* Answer History Timeline */}
                              {(() => {
                                const history = getQuestionHistory(q.id);
                                if (history.length <= 1) return null;
                                return (
                                  <div className="mt-3 pt-3 border-t border-slate-700">
                                    <p className="text-xs text-slate-400 uppercase mb-2">🕐 Storico modifiche ({history.length})</p>
                                    <div className="space-y-2 max-h-40 overflow-y-auto">
                                      {history.map((h, idx) => {
                                        const mentionedNames = (h.mentioned_users || [])
                                          .map(uid => users.find(u => u.id === uid)?.name)
                                          .filter(Boolean);
                                        return (
                                          <div key={h.id} className={`p-2 rounded text-xs ${idx === 0 ? 'bg-teal-900/20 border-l-2 border-teal-500' : 'bg-slate-700/30 border-l-2 border-slate-600'}`}>
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-slate-500">
                                                {new Date(h.created_at).toLocaleString('it-IT')}
                                              </span>
                                              <div className="flex items-center gap-1">
                                                {idx === 0 && <Badge variant="success">Attuale</Badge>}
                                                <Badge variant={h.source === 'stt_correction' ? 'warning' : h.source === 'stt' ? 'info' : 'default'}>
                                                  {h.source === 'stt_correction' ? '🔄 Correzione' : h.source === 'stt' ? '🎤 STT' : '✏️ Manuale'}
                                                </Badge>
                                              </div>
                                            </div>
                                            <p className={`${idx === 0 ? 'text-teal-200' : 'text-slate-400'}`}>"{h.answer}"</p>
                                            {mentionedNames.length > 0 && (
                                              <p className="text-xs text-slate-500 mt-1">👥 {mentionedNames.join(', ')}</p>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })()}
                              
                              <div className="flex gap-2 mt-3">
                                <Button size="sm" variant="secondary" onClick={() => { setEditingAnswerId(q.id); setAnswerDraft(q.answer || ''); }}>
                                  <Icons.Edit /> Modifica
                                </Button>
                                <Button size="sm" variant="danger" onClick={() => deleteAnswer(q.id)}>
                                  <Icons.Trash /> Elimina
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Unanswered Questions */}
            <Card className="p-4">
              <h3 className="font-semibold text-white mb-4">⚡ Domande Prioritarie</h3>
              <div className="space-y-2">
                {unansweredQuestions.slice(0, 10).map(q => (
                  <div key={q.id}>
                    <div
                      onClick={() => setActiveQuestionId(activeQuestionId === q.id ? null : q.id)}
                      className={`p-3 rounded border-l-4 cursor-pointer hover:bg-slate-700/30 transition-colors ${
                        q.priority === 'critical' ? 'border-red-500 bg-red-900/20' :
                        q.priority === 'high' ? 'border-amber-500 bg-amber-900/20' :
                        q.priority === 'medium' ? 'border-blue-500 bg-blue-900/20' :
                        'border-slate-500 bg-slate-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          q.priority === 'critical' ? 'danger' :
                          q.priority === 'high' ? 'warning' : 'info'
                        }>
                          {q.priority}
                        </Badge>
                        <span className="text-xs text-slate-500">{q.category}</span>
                        <Icons.ChevronRight />
                      </div>
                      <p className="text-sm text-slate-200 mt-2">{q.text}</p>
                    </div>

                    {activeQuestionId === q.id && (
                      <div className="mt-2 p-3 bg-slate-900/50 rounded border border-slate-700">
                        <TextArea
                          value={answerDraft}
                          onChange={setAnswerDraft}
                          placeholder="Inserisci la risposta..."
                          rows={3}
                        />
                        <p className="text-xs text-slate-500 mt-1">💡 Se menzioni un nome del team (es. "Anita"), verrà collegato al suo profilo</p>
                        <div className="flex gap-2 mt-2">
                          <Button size="sm" onClick={() => answerQuestion(q.id)}>
                            <Icons.Save /> Salva
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setActiveQuestionId(null)}>
                            Annulla
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* AI Suggestions from STT */}
            {(sttSuggestions.length > 0 || sttUncertainties.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {sttSuggestions.length > 0 && (
                  <Card className="p-4 border-teal-700">
                    <h4 className="font-semibold text-teal-400 mb-2">💡 Suggerimenti AI</h4>
                    <div className="space-y-1">
                      {sttSuggestions.slice(0, 5).map((s, i) => (
                        <p key={i} className="text-sm text-slate-300">{s.content}</p>
                      ))}
                    </div>
                  </Card>
                )}
                {sttUncertainties.length > 0 && (
                  <Card className="p-4 border-amber-700">
                    <h4 className="font-semibold text-amber-400 mb-2">⚠️ Da Chiarire</h4>
                    <div className="space-y-1">
                      {sttUncertainties.slice(0, 5).map((u, i) => (
                        <p key={i} className="text-sm text-slate-300">
                          {u.topic}: {u.reason} → <span className="text-amber-300">{u.question}</span>
                        </p>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========== TEAM VIEW ========== */}
        {view === 'team' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">👥 Team</h2>

            <div className="grid grid-cols-2 gap-4">
              {(canViewAll ? users.filter(u => u.role !== 'consultant') : [currentUser]).filter(Boolean).map(member => {
                if (!member) return null;
                
                const memberTasks = userTasks.filter(t => t.user_id === member.id);
                const memberBlockers = blockers.filter(b => b.user_id === member.id);
                const memberMentions = getQuestionsAboutUser(member.id);
                const memberHistory = getAnswerHistoryForUser(member.id);
                const isEditing = editingUserId === member.id;
                const canEdit = isGodMode || (canEditOwnProfile && currentUser?.id === member.id) || currentUser?.role === 'owner';

                return (
                  <Card key={member.id} className="p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                          member.role === 'owner' ? 'bg-amber-600' : 'bg-slate-600'
                        }`}>
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-semibold">{member.name}</p>
                          <p className="text-sm text-slate-400">
                            {member.role === 'owner' ? '👑 Owner' : `📍 ${member.market_focus || '—'}`}
                          </p>
                        </div>
                      </div>
                      {canEdit && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => setEditingUserId(isEditing ? null : member.id)}
                        >
                          <Icons.Edit /> {isEditing ? 'Chiudi' : 'Modifica'}
                        </Button>
                      )}
                    </div>

                    {/* Work Type */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 uppercase mb-1">Tipo contratto</p>
                      {isEditing ? (
                        <Select
                          value={member.work_type || ''}
                          onChange={(val) => updateUser(member.id, { work_type: val as WorkType })}
                          options={[
                            { value: 'fulltime', label: 'Full-time' },
                            { value: 'parttime', label: 'Part-time' }
                          ]}
                          placeholder="Seleziona..."
                        />
                      ) : (
                        <Badge variant={member.work_type === 'fulltime' ? 'success' : member.work_type === 'parttime' ? 'info' : 'default'}>
                          {member.work_type || 'Non definito'}
                        </Badge>
                      )}
                    </div>

                    {/* Current Mentions */}
                    {memberMentions.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 uppercase mb-2">📝 Attualmente menzionato in ({memberMentions.length})</p>
                        <div className="space-y-1">
                          {memberMentions.slice(0, 3).map(q => (
                            <div key={q.id} className="p-2 bg-teal-900/20 rounded text-xs">
                              <p className="text-teal-300 font-medium">{q.text}</p>
                              <p className="text-slate-400 mt-1">"{q.answer?.substring(0, 100)}..."</p>
                            </div>
                          ))}
                          {memberMentions.length > 3 && (
                            <p className="text-xs text-slate-500">+{memberMentions.length - 3} altre menzioni</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* History Timeline - Shows ALL mentions over time */}
                    {memberHistory.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 uppercase mb-2">🕐 Storico menzioni ({memberHistory.length})</p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {memberHistory.slice(0, 5).map(h => {
                            const question = questions.find(q => q.id === h.question_id);
                            return (
                              <div key={h.id} className="p-2 bg-slate-700/30 rounded text-xs border-l-2 border-slate-500">
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500">
                                    {new Date(h.created_at).toLocaleString('it-IT', { 
                                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' 
                                    })}
                                  </span>
                                  <Badge variant={h.source === 'stt_correction' ? 'warning' : h.source === 'stt' ? 'info' : 'default'}>
                                    {h.source === 'stt_correction' ? '🔄' : h.source === 'stt' ? '🎤' : '✏️'}
                                  </Badge>
                                </div>
                                <p className="text-slate-300 mt-1">"{h.answer.substring(0, 80)}..."</p>
                                {question && (
                                  <p className="text-slate-500 text-xs mt-1">Re: {question.text.substring(0, 40)}...</p>
                                )}
                              </div>
                            );
                          })}
                          {memberHistory.length > 5 && (
                            <p className="text-xs text-slate-500">+{memberHistory.length - 5} altri nel cronologico</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Tasks */}
                    <div className="mb-4">
                      <p className="text-xs text-slate-400 uppercase mb-2">Task ({memberTasks.length}/10)</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {memberTasks.map(task => (
                          <span key={task.id} className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${task.is_custom ? 'bg-teal-700 text-teal-100' : 'bg-slate-700 text-slate-300'}`}>
                            {task.is_custom && '✏️ '}{task.task_name}
                            {isEditing && (
                              <button onClick={() => removeUserTask(task.id)} className="text-red-400 hover:text-red-300">
                                <Icons.X />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                      {isEditing && memberTasks.length < 10 && (
                        <div className="space-y-2">
                          <Select
                            value=""
                            onChange={(val) => {
                              const task = taskDefinitions.find(t => t.id === val);
                              if (task) addUserTask(member.id, task.id, task.name, false);
                            }}
                            options={taskDefinitions
                              .filter(t => !memberTasks.some(mt => mt.task_id === t.id))
                              .map(t => ({ value: t.id, label: t.name }))}
                            placeholder="+ Scegli da lista..."
                          />
                          <div className="flex gap-2">
                            <Input
                              value={customTaskDraft[member.id] || ''}
                              onChange={(val) => setCustomTaskDraft(prev => ({ ...prev, [member.id]: val }))}
                              placeholder="Scrivi task personalizzato..."
                              className="flex-1 text-sm"
                            />
                            {customTaskDraft[member.id]?.trim() && (
                              <Button 
                                size="sm"
                                onClick={() => {
                                  const customId = `custom_${Date.now()}`;
                                  addUserTask(member.id, customId, customTaskDraft[member.id].trim(), true);
                                  setCustomTaskDraft(prev => ({ ...prev, [member.id]: '' }));
                                }}
                              >
                                + Aggiungi
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Team Notes & Ideas */}
                    {(canViewAll || currentUser?.id === member.id) && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 uppercase mb-2">📝 Note & Idee</p>
                        
                        {/* Add new note - only for own profile or consultant */}
                        {(currentUser?.id === member.id || isGodMode) && (
                          <div className="mb-3">
                            <TextArea
                              value={noteDraft[member.id] || ''}
                              onChange={(val) => setNoteDraft(prev => ({ ...prev, [member.id]: val }))}
                              placeholder="Scrivi una nota, idea o suggerimento..."
                              rows={2}
                            />
                            {noteDraft[member.id]?.trim() && (
                              <div className="flex gap-2 mt-2">
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  onClick={() => saveNoteDraft(member.id, noteDraft[member.id])}
                                >
                                  💾 Salva bozza
                                </Button>
                                <Button 
                                  size="sm"
                                  onClick={async () => {
                                    const { data } = await supabase
                                      .from('team_notes')
                                      .insert({
                                        user_id: member.id,
                                        content: noteDraft[member.id].trim(),
                                        status: 'published',
                                        published_at: new Date().toISOString()
                                      })
                                      .select()
                                      .single();
                                    if (data) {
                                      setTeamNotes(prev => [data, ...prev]);
                                      setNoteDraft(prev => ({ ...prev, [member.id]: '' }));
                                    }
                                  }}
                                >
                                  🚀 Pubblica su dashboard
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Existing notes */}
                        {(() => {
                          const memberNotes = teamNotes.filter(n => n.user_id === member.id);
                          const drafts = memberNotes.filter(n => n.status === 'draft');
                          const published = memberNotes.filter(n => n.status === 'published');
                          
                          return (
                            <div className="space-y-2">
                              {/* Drafts - only visible to owner or consultant */}
                              {(currentUser?.id === member.id || isGodMode) && drafts.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-amber-400">📋 Bozze ({drafts.length})</p>
                                  {drafts.map(note => (
                                    <div key={note.id} className="p-2 bg-amber-900/20 rounded text-xs border-l-2 border-amber-500">
                                      {editingNoteId === note.id ? (
                                        <div>
                                          <TextArea
                                            value={note.content}
                                            onChange={(val) => setTeamNotes(prev => prev.map(n => n.id === note.id ? {...n, content: val} : n))}
                                            rows={2}
                                          />
                                          <div className="flex gap-1 mt-1">
                                            <Button size="sm" variant="ghost" onClick={() => updateNote(note.id, note.content)}>
                                              💾
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>
                                              ✕
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <p className="text-amber-200 mb-2">{note.content}</p>
                                          <div className="flex items-center justify-between">
                                            <span className="text-slate-500">
                                              {new Date(note.created_at).toLocaleDateString('it-IT')}
                                            </span>
                                            <div className="flex gap-1">
                                              <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(note.id)}>
                                                ✏️
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                onClick={() => rewriteNote(note.id)}
                                                disabled={rewritingNoteId === note.id}
                                              >
                                                {rewritingNoteId === note.id ? '⏳' : '✨'} Rielabora
                                              </Button>
                                              <Button size="sm" variant="ghost" onClick={() => publishNote(note.id)}>
                                                🚀 Pubblica
                                              </Button>
                                              <Button size="sm" variant="ghost" onClick={() => deleteNote(note.id)}>
                                                🗑️
                                              </Button>
                                            </div>
                                          </div>
                                        </>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Published notes - visible to all */}
                              {published.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs text-teal-400">✅ Pubblicate ({published.length})</p>
                                  {published.slice(0, 3).map(note => (
                                    <div key={note.id} className="p-2 bg-teal-900/20 rounded text-xs border-l-2 border-teal-500">
                                      <p className="text-teal-200">{note.content}</p>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-slate-500">
                                          {note.published_at && new Date(note.published_at).toLocaleDateString('it-IT')}
                                        </span>
                                        {(currentUser?.id === member.id || isGodMode) && (
                                          <div className="flex gap-1">
                                            <Button 
                                              size="sm" 
                                              variant="ghost" 
                                              onClick={() => rewriteNote(note.id)}
                                              disabled={rewritingNoteId === note.id}
                                            >
                                              {rewritingNoteId === note.id ? '⏳' : '✨'}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => deleteNote(note.id)}>
                                              🗑️
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                  {published.length > 3 && (
                                    <p className="text-xs text-slate-500">+{published.length - 3} altre note</p>
                                  )}
                                </div>
                              )}

                              {memberNotes.length === 0 && (
                                <p className="text-xs text-slate-500 italic">Nessuna nota</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Blockers */}
                    {(canViewAll || currentUser?.id === member.id) && memberBlockers.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-slate-400 uppercase mb-2">Blocchi segnalati</p>
                        <div className="space-y-1">
                          {memberBlockers.slice(0, 3).map(b => (
                            <div key={b.id} className="p-2 bg-red-900/20 rounded text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-red-200">{b.title}</span>
                                <Badge variant={b.status === 'resolved' ? 'success' : 'danger'}>{b.status}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ========== MARKETS VIEW ========== */}
        {view === 'markets' && canViewAll && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">🌍 Market Intelligence</h2>

            <div className="grid grid-cols-3 gap-4">
              {markets.map(m => (
                <Card key={m.code} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white">{m.code}</span>
                    <Badge variant={
                      m.confidence === 'verified' ? 'success' :
                      m.confidence === 'high' ? 'info' : 'warning'
                    }>
                      {m.confidence}
                    </Badge>
                  </div>
                  <p className="text-white">{m.name}</p>
                  <p className="text-sm text-slate-400">{m.region}</p>
                  <div className="mt-3 pt-3 border-t border-slate-700 space-y-1">
                    <p className="text-xs"><span className="text-slate-400">Status:</span> <span className="text-teal-400">{m.status}</span></p>
                    <p className="text-xs"><span className="text-slate-400">Regulator:</span> {m.regulator}</p>
                    <p className="text-xs text-slate-500 mt-2">{m.summary}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ========== OWNER PRIVATE AREA ========== */}
        {view === 'owner_private' && canViewOwnerData && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Icons.Lock />
              <h2 className="text-2xl font-bold text-white">Area Riservata</h2>
              {isGodMode && <Badge variant="info">God Mode</Badge>}
            </div>

            <Card className="p-6">
              <h3 className="font-semibold text-white mb-4">💰 Dati Confidenziali</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 uppercase">Budget Totale (€)</label>
                  <Input
                    type="number"
                    value={project?.budget_total?.toString() || ''}
                    onChange={(val) => updateProject({ budget_total: parseInt(val) || 0 })}
                    placeholder="Es: 100000"
                    disabled={!canEditProject}
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 uppercase">Margine Target (%)</label>
                  <Input
                    type="number"
                    value={project?.margin_target?.toString() || ''}
                    onChange={(val) => updateProject({ margin_target: parseInt(val) || 0 })}
                    placeholder="Es: 30"
                    disabled={!canEditProject}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-xs text-slate-400 uppercase">Note Strategiche</label>
                <TextArea
                  value={project?.strategic_notes || ''}
                  onChange={(val) => updateProject({ strategic_notes: val })}
                  placeholder="Note riservate visibili solo a owner e consultant..."
                  rows={4}
                  disabled={!canEditProject}
                />
              </div>

              {!canEditProject && (
                <p className="text-xs text-slate-500 mt-4">
                  <Icons.Eye /> Visualizzazione in sola lettura (God Mode)
                </p>
              )}
            </Card>

            {/* Decision Log */}
            <Card className="p-4">
              <h3 className="font-semibold text-white mb-4">📋 Log Decisioni</h3>
              {decisions.length === 0 ? (
                <p className="text-slate-500 text-sm">Nessuna decisione registrata</p>
              ) : (
                <div className="space-y-2">
                  {decisions.slice(0, 10).map(d => (
                    <div key={d.id} className="p-3 bg-slate-700/50 rounded">
                      <div className="flex items-center justify-between">
                        <p className="text-white font-medium">{d.title}</p>
                        <span className="text-xs text-slate-400">
                          {new Date(d.created_at).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">{d.description}</p>
                      {d.reasoning && (
                        <p className="text-xs text-slate-500 mt-1">Reasoning: {d.reasoning}</p>
                      )}
                      <p className="text-xs text-teal-400 mt-1">by {d.made_by}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {/* ========== REPORTS VIEW ========== */}
        {view === 'reports' && canViewAll && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">📄 Reports</h2>

            <Card className="p-6">
              <h3 className="font-semibold text-white mb-4">Discovery Progress Report</h3>
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-slate-700/50 rounded">
                  <p className="text-3xl font-bold text-white">{answeredQuestions.length}</p>
                  <p className="text-xs text-slate-400">Domande risposte</p>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded">
                  <p className="text-3xl font-bold text-red-400">{criticalGaps.length}</p>
                  <p className="text-xs text-slate-400">Gap critici</p>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded">
                  <p className="text-3xl font-bold text-teal-400">{sttExtractions.length}</p>
                  <p className="text-xs text-slate-400">Dati estratti (STT)</p>
                </div>
                <div className="text-center p-4 bg-slate-700/50 rounded">
                  <p className="text-3xl font-bold text-amber-400">{blockers.filter(b => b.status !== 'resolved').length}</p>
                  <p className="text-xs text-slate-400">Blocchi aperti</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => {
                  const report = {
                    generated_at: new Date().toISOString(),
                    project,
                    questions_answered: answeredQuestions.length,
                    questions_total: questions.length,
                    critical_gaps: criticalGaps.map(q => q.text),
                    answered_questions: answeredQuestions.map(q => ({
                      question: q.text,
                      answer: q.answer,
                      answered_by: q.answered_by,
                      mentioned_users: q.mentioned_users?.map(uid => users.find(u => u.id === uid)?.name)
                    })),
                    team_summary: teamMembers.map(m => ({
                      name: m.name,
                      market: m.market_focus,
                      work_type: m.work_type,
                      tasks: userTasks.filter(t => t.user_id === m.id).map(t => t.task_name),
                      mentions: getQuestionsAboutUser(m.id).length,
                      open_blockers: blockers.filter(b => b.user_id === m.id && b.status !== 'resolved').length
                    })),
                    stt_extractions: sttExtractions,
                    decisions: decisions.slice(0, 20)
                  };
                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `discovery-report-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}>
                  <Icons.Download /> Esporta JSON
                </Button>
                <Button variant="secondary" onClick={exportToPDF}>
                  <Icons.Download /> Esporta PDF
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ========== SETTINGS VIEW ========== */}
        {view === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">⚙️ Settings</h2>

            <Card className="p-4">
              <h3 className="font-semibold text-white mb-4">Utente corrente</h3>
              <div className="space-y-2">
                <p className="text-slate-300">Nome: {currentUser?.name}</p>
                <p className="text-slate-300">Ruolo: {currentUser?.role}</p>
                {currentUser?.market_focus && <p className="text-slate-300">Market: {currentUser.market_focus}</p>}
                <p className="text-slate-300">
                  Permessi: {isGodMode ? '🔮 God Mode (accesso completo)' : 
                    canViewOwnerData ? '👑 Owner (accesso dati riservati)' : 
                    '👤 Team Member (accesso limitato)'}
                </p>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-white mb-4">Speech-to-Text</h3>
              <p className="text-sm text-slate-400">
                Status: {sttSupported ? '✅ Supportato (Web Speech API)' : '❌ Non supportato - usa Chrome o Edge'}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                I dati estratti vengono salvati automaticamente su Supabase.
              </p>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
