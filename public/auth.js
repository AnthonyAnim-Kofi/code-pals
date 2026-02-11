/**
 * AuthManager - Vanilla JS authentication manager using Supabase
 * Replaces the React AuthContext with plain JavaScript
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.session = null;
    this.loading = true;
    this.listeners = [];
    this.supabase = null;
    
    // Initialize Supabase client
    this.initSupabase();
  }

  initSupabase() {
    // Get Supabase URL and key from environment or config
    const SUPABASE_URL = window.VITE_SUPABASE_URL || '';
    const SUPABASE_KEY = window.VITE_SUPABASE_PUBLISHABLE_KEY || '';
    
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.error('Supabase credentials not configured');
      this.loading = false;
      return;
    }

    // Create Supabase client
    this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        storage: localStorage,
        persistSession: true,
        autoRefreshToken: true,
      }
    });

    // Set up auth state listener
    this.supabase.auth.onAuthStateChange((event, session) => {
      this.session = session;
      this.user = session?.user ?? null;
      this.loading = false;
      this.notifyListeners();
    });

    // Check for existing session
    this.supabase.auth.getSession().then(({ data: { session } }) => {
      this.session = session;
      this.user = session?.user ?? null;
      this.loading = false;
      this.notifyListeners();
    });
  }

  // Subscribe to auth state changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notifyListeners() {
    this.listeners.forEach(callback => {
      callback({
        user: this.user,
        session: this.session,
        loading: this.loading
      });
    });
  }

  async signIn(email, password) {
    try {
      const { error } = await this.supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  async signUp(email, password) {
    try {
      const { error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  async signInWithGoogle() {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  async signOut() {
    try {
      await this.supabase.auth.signOut();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }

  isAuthenticated() {
    return !!this.user;
  }

  getUser() {
    return this.user;
  }

  getSession() {
    return this.session;
  }
}

// Create global auth manager instance
window.authManager = new AuthManager();
