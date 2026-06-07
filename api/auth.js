const supabase = require('./supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'POST':
        await handleAuth(req, res);
        break;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: error.message || 'Server error' });
  }
};

async function handleAuth(req, res) {
  const { action, email, password, name } = req.body;

  if (!action) {
    return res.status(400).json({ error: 'Action is required' });
  }

  switch (action) {
    case 'register':
      await registerUser(req, res, email, password, name);
      break;
    case 'login':
      await loginUser(req, res, email, password);
      break;
    default:
      res.status(400).json({ error: 'Invalid action' });
  }
}

async function registerUser(req, res, email, password, name) {
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || email.split('@')[0] }
    }
  });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  if (data.user) {
    const { error: dbError } = await supabase
      .from('users')
      .insert([{ id: data.user.id, email, name: name || email.split('@')[0] }]);

    if (dbError) {
      console.error('Create user error:', dbError);
    }
  }

  res.json({ success: true, user: data.user, session: data.session });
}

async function loginUser(req, res, email, password) {
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json({ success: true, user: data.user, session: data.session });
}