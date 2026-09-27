import { useState, useEffect, useRef } from 'react';
import { BookOpen, Target, Flame, Trophy, ChevronRight, LogOut, Clock, CheckCircle, XCircle, ArrowLeft, Zap } from 'lucide-react';
import { supabase } from './supabaseClient';

// --- TYPES ---
type View = 'profile_setup' | 'dashboard' | 'chapters' | 'quiz' | 'results';
type Profile = { class: string; target_exam: string; streak_count: number; full_name: string };
type Chapter = { id: string; subject: string; title: string };
type Question = { id: string; question_type: string; question_text: string; options: any[]; correct_answer: string; explanation: string; difficulty: string };

function App() {
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<View>('dashboard');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Real Database Chapters State
  const [dbChapters, setDbChapters] = useState<any[]>([]);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  // Quiz States
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);

  // Profile Setup States
  const [newName, setNewName] = useState('');
  const [newClass, setNewClass] = useState('12');
  const [newTarget, setNewTarget] = useState('JEE');

  const timerRef = useRef<any>(null);

  // --- INITIAL LOAD & AUTH ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- FETCH REAL CHAPTERS FROM DATABASE ---
  useEffect(() => {
    if (view === 'chapters' && profile) {
      const fetchChapters = async () => {
        setIsLoadingChapters(true);
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('class', profile.class)
          .order('subject', { ascending: true });
        
        if (data) setDbChapters(data);
        setIsLoadingChapters(false);
      };
      fetchChapters();
    }
  }, [view, profile]);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (data) {
      setProfile(data);
      setView('dashboard');
    } else {
      setView('profile_setup');
    }
    setLoading(false);
  };

  // --- AUTH & PROFILE ---
  const handleSaveProfile = async () => {
    if (!session || !newName) return;
    await supabase.from('profiles').upsert({
      id: session.user.id,
      full_name: newName,
      class: newClass,
      target_exam: newTarget,
      streak_count: 0,
      last_active_date: new Date().toISOString().split('T')[0]
    });
    setProfile({ full_name: newName, class: newClass, target_exam: newTarget, streak_count: 0 });
    setView('dashboard');
  };

  const handleLogout = async () => { await supabase.auth.signOut(); };

  // --- QUIZ LOGIC ---
  const startQuiz = async (chapter: Chapter) => {
    setSelectedChapter(chapter);
    const { data } = await supabase.from('questions').select('*').eq('chapter_id', chapter.id);
    
    if (data && data.length > 0) {
      setQuestions(data);
      setUserAnswers(new Array(data.length).fill(''));
      setMarkedForReview(new Array(data.length).fill(false));
      setCurrentQIndex(0);
      setTimeLeft(data.length * 60); 
      setView('quiz');
      startTimer(data.length * 60);
    } else {
      alert('No questions added for this chapter yet! We are working on it.');
      setView('chapters');
    }
  };

  const startTimer = (seconds: number) => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); finishQuiz(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const finishQuiz = async () => {
    clearInterval(timerRef.current);
    let correct = 0;
    questions.forEach((q, i) => { if (userAnswers[i] === q.correct_answer) correct++; });
    setScore(correct);
    
    if (session) {
      await supabase.from('test_attempts').insert({
        user_id: session.user.id,
        chapter_id: selectedChapter?.id,
        score: correct,
        total_questions: questions.length,
        time_taken_seconds: (selectedChapter ? questions.length * 60 : 0) - timeLeft
      });
    }
    setView('results');
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  // --- RENDER LOGIN ---
  if (!session && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
          <h1 className="text-3xl font-bold text-blue-600 text-center mb-2">PrepZee</h1>
          <p className="text-center text-slate-500 mb-6">Your JEE & PSEB Prep Companion</p>
          <LoginSignup />
        </div>
      </div>
    );
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-blue-600 font-bold">Loading PrepZee...</div>;

  // --- RENDER PROFILE SETUP ---
  if (view === 'profile_setup') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Complete Your Profile</h2>
          <div className="space-y-4">
            <input type="text" placeholder="Your Name" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-2 block">Current Class</label>
              <div className="flex gap-3">
                {['11', '12'].map(c => (
                  <button key={c} onClick={() => setNewClass(c)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${newClass === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>Class {c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-600 mb-2 block">Target Exam</label>
              <div className="flex gap-3">
                {['JEE', 'PSEB', 'Both'].map(t => (
                  <button key={t} onClick={() => setNewTarget(t)} className={`flex-1 py-3 rounded-xl font-bold transition-all ${newTarget === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{t}</button>
                ))}
              </div>
            </div>
            <button onClick={handleSaveProfile} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 mt-4">Start Learning</button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DASHBOARD ---
  if (view === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-2xl font-bold text-blue-600">PrepZee</h1>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-500"><LogOut size={20} /></button>
        </header>
        <main className="p-4 max-w-4xl mx-auto space-y-6">
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-2xl shadow-lg">
            <p className="text-blue-100 text-sm">Welcome back,</p>
            <h2 className="text-2xl font-bold mb-4">{profile?.full_name} (Class {profile?.class})</h2>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-xl w-fit">
              <Flame className="text-orange-400" size={20} />
              <span className="font-semibold">{profile?.streak_count || 0} Day Study Streak 🔥</span>
            </div>
          </div>

          <button onClick={() => setView('chapters')} className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded-lg"><BookOpen className="text-blue-600" size={24} /></div>
              <div className="text-left">
                <h4 className="font-bold text-lg">Start Practicing</h4>
                <p className="text-sm text-slate-500">Chapter-wise MCQs & Numericals</p>
              </div>
            </div>
            <ChevronRight className="text-slate-400" size={24} />
          </button>

          {profile?.class === '11' && (
            <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-2xl text-center">
              <Zap className="text-yellow-500 mx-auto mb-2" size={32} />
              <h3 className="font-bold text-yellow-800 text-lg">Class 11 Resources Coming Soon!</h3>
              <p className="text-yellow-700 text-sm mt-1">We are currently building the Class 11 JEE/PSEB content.</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // --- RENDER REAL CHAPTERS LIST ---
  if (view === 'chapters') {
    const isClass11 = profile?.class === '11';
    const physics = dbChapters.filter(c => c.subject === 'Physics');
    const chemistry = dbChapters.filter(c => c.subject === 'Chemistry');
    const math = dbChapters.filter(c => c.subject === 'Mathematics');

    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <header className="bg-white shadow-sm p-4 flex items-center gap-4 sticky top-0 z-10">
          <button onClick={() => setView('dashboard')}><ArrowLeft size={24} /></button>
          <h2 className="text-xl font-bold">Class {profile?.class} Chapters</h2>
        </header>
        <main className="p-4 max-w-4xl mx-auto space-y-4">
          {isClass11 ? (
            <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 text-center">
              <BookOpen className="text-slate-300 mx-auto mb-4" size={64} />
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Class 11 Content</h3>
              <p className="text-slate-500">Coming Soon!</p>
            </div>
          ) : isLoadingChapters ? (
            <div className="text-center py-10 text-slate-500">Loading chapters...</div>
          ) : (
            <>
              {physics.length > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-3 px-2 text-blue-700">Physics</h3>
                  <div className="space-y-2">
                    {physics.map(ch => <ChapterBtn key={ch.id} title={ch.title} onClick={() => startQuiz(ch)} />)}
                  </div>
                </div>
              )}
              {chemistry.length > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-3 px-2 text-green-700">Chemistry</h3>
                  <div className="space-y-2">
                    {chemistry.map(ch => <ChapterBtn key={ch.id} title={ch.title} onClick={() => startQuiz(ch)} />)}
                  </div>
                </div>
              )}
              {math.length > 0 && (
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <h3 className="font-bold text-lg mb-3 px-2 text-purple-700">Mathematics</h3>
                  <div className="space-y-2">
                    {math.map(ch => <ChapterBtn key={ch.id} title={ch.title} onClick={() => startQuiz(ch)} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    );
  }

  // --- RENDER QUIZ ---
  if (view === 'quiz' && questions.length > 0) {
    const q = questions[currentQIndex];
    const isMCQ = q.question_type === 'MCQ';
    
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2 text-red-500 font-mono font-bold"><Clock size={20} /> {formatTime(timeLeft)}</div>
          <span className="font-bold">Q {currentQIndex + 1}/{questions.length}</span>
          <button onClick={() => setMarkedForReview(prev => { const n = [...prev]; n[currentQIndex] = !n[currentQIndex]; return n; })} className={`p-2 rounded-lg ${markedForReview[currentQIndex] ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
            <Target size={20} />
          </button>
        </header>
        <main className="p-4 max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <span className="text-xs font-bold text-blue-600 uppercase">{q.difficulty} • {q.question_type}</span>
            <h3 className="text-xl font-bold mt-2 mb-4">{q.question_text}</h3>
            
            {isMCQ ? (
              <div className="space-y-3">
                {q.options.map((opt: any, i: number) => (
                  <button key={i} onClick={() => { const n = [...userAnswers]; n[currentQIndex] = opt.text; setUserAnswers(n); }} className={`w-full text-left p-4 rounded-xl border-2 transition-all ${userAnswers[currentQIndex] === opt.text ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                    {opt.text}
                  </button>
                ))}
              </div>
            ) : (
              <input type="text" value={userAnswers[currentQIndex]} onChange={e => { const n = [...userAnswers]; n[currentQIndex] = e.target.value; setUserAnswers(n); }} placeholder="Type your numerical answer..." className="w-full p-4 border-2 border-slate-200 rounded-xl outline-none focus:border-blue-500" />
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setCurrentQIndex(Math.max(0, currentQIndex - 1))} disabled={currentQIndex === 0} className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-xl font-bold disabled:opacity-50">Previous</button>
            {currentQIndex === questions.length - 1 ? (
              <button onClick={finishQuiz} className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold">Submit Test</button>
            ) : (
              <button onClick={() => setCurrentQIndex(currentQIndex + 1)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold">Next</button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // --- RENDER RESULTS ---
  if (view === 'results') {
    const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-4 flex flex-col items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center border border-slate-100">
          <Trophy className={`mx-auto mb-4 ${percentage >= 70 ? 'text-yellow-500' : 'text-slate-400'}`} size={64} />
          <h2 className="text-3xl font-bold mb-2">Test Complete!</h2>
          <p className="text-slate-500 mb-6">{selectedChapter?.title}</p>
          
          <div className="bg-slate-50 p-6 rounded-xl mb-6">
            <p className="text-5xl font-bold text-blue-600">{percentage}%</p>
            <p className="text-slate-600 mt-2">{score} / {questions.length} Correct</p>
          </div>

          <div className="space-y-3 text-left mb-6 max-h-96 overflow-y-auto">
            {questions.map((q, i) => (
              <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start gap-2">
                  {userAnswers[i] === q.correct_answer ? <CheckCircle className="text-green-500 mt-1 flex-shrink-0" size={20}/> : <XCircle className="text-red-500 mt-1 flex-shrink-0" size={20}/>}
                  <div>
                    <p className="font-semibold text-sm">{q.question_text}</p>
                    <p className="text-xs text-slate-500 mt-1">Your answer: <span className={userAnswers[i] === q.correct_answer ? 'text-green-600' : 'text-red-600'}>{userAnswers[i] || 'Skipped'}</span></p>
                    {userAnswers[i] !== q.correct_answer && <p className="text-xs text-green-600">Correct: {q.correct_answer}</p>}
                    <p className="text-xs text-blue-600 mt-2 italic">{q.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setView('dashboard')} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return null;
}

// --- HELPER COMPONENTS ---
function ChapterBtn({ title, onClick }: { title: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left p-3 bg-slate-50 hover:bg-blue-50 rounded-lg flex items-center justify-between transition-colors group">
      <span className="font-medium text-slate-700 group-hover:text-blue-600">{title}</span>
      <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600" />
    </button>
  );
}

function LoginSignup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp) await supabase.auth.signUp({ email, password });
    else await supabase.auth.signInWithPassword({ email, password });
  };

  return (
    <form onSubmit={handleAuth} className="space-y-4">
      <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
      <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" />
      <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">{isSignUp ? 'Sign Up' : 'Log In'}</button>
      <p className="text-center text-sm text-slate-500">
        {isSignUp ? 'Have an account?' : "Need an account?"}{' '}
        <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-bold">{isSignUp ? 'Log In' : 'Sign Up'}</button>
      </p>
    </form>
  );
}

export default App;