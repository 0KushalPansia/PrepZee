import { useState, useEffect } from 'react';
import { BookOpen, Target, Flame, Trophy, ChevronRight, LogOut } from 'lucide-react';
import { supabase } from './supabaseClient';

function App() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [activeExam, setActiveExam] = useState<'JEE' | 'PSEB'>('JEE');

  // Check if user is logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle Login/Signup
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) alert(error.message);
      else alert('Account created! Please log in.');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // IF NOT LOGGED IN: Show Login Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-slate-100">
          <h1 className="text-3xl font-bold text-blue-600 text-center mb-2">PrepZee</h1>
          <p className="text-center text-slate-500 mb-6">Your JEE & PSEB Prep Companion</p>
          
          <form onSubmit={handleAuth} className="space-y-4">
            <input 
              type="email" 
              placeholder="Email address" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input 
              type="password" 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Sign Up' : 'Log In')}
            </button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-blue-600 font-semibold hover:underline">
                {isSignUp ? 'Log In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // IF LOGGED IN: Show Dashboard
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-blue-600">PrepZee</h1>
        <button onClick={handleLogout} className="flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors">
          <LogOut size={18} />
          <span className="text-sm font-medium hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="p-4 max-w-4xl mx-auto space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-2xl shadow-lg">
          <p className="text-blue-100 text-sm">Welcome back,</p>
          <h2 className="text-xl font-bold mb-4 truncate">{session.user.email}</h2>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm p-3 rounded-xl w-fit">
            <Flame className="text-orange-400" size={20} />
            <span className="font-semibold">5 Day Study Streak 🔥</span>
          </div>
        </div>

        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200">
          <button 
            onClick={() => setActiveExam('JEE')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${activeExam === 'JEE' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}
          >
            JEE Preparation
          </button>
          <button 
            onClick={() => setActiveExam('PSEB')}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all ${activeExam === 'PSEB' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}
          >
            PSEB Boards
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Target className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Tests Taken</p>
              <p className="text-xl font-bold">12</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-500">Avg. Score</p>
              <p className="text-xl font-bold">85%</p>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-3 px-1">Continue Studying</h3>
          <div className="space-y-3">
            {['Physics', 'Chemistry', 'Mathematics'].map((subject) => (
              <div key={subject} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between cursor-pointer hover:border-blue-300 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <BookOpen className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h4 className="font-semibold">{subject}</h4>
                    <p className="text-xs text-slate-500">
                      {activeExam === 'JEE' ? 'Next: Electrostatics' : 'Next: Chapter 1 Summary'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400" size={20} />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;