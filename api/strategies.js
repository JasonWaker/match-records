const supabase = require('./supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    switch (req.method) {
      case 'GET':
        await getStrategies(req, res, user.id);
        break;
      case 'POST':
        await createStrategy(req, res, user.id);
        break;
      case 'DELETE':
        await deleteStrategy(req, res, user.id);
        break;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Strategies error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

async function getStrategies(req, res, userId) {
  const { data, error } = await supabase
    .from('strategies')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, strategies: data });
}

async function createStrategy(req, res, userId) {
  const { name, description, accuracy } = req.body;

  const { data, error } = await supabase
    .from('strategies')
    .insert([{ user_id: userId, name, description, accuracy }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, strategy: data[0] });
}

async function deleteStrategy(req, res, userId) {
  const { id } = req.query;

  const { data, error } = await supabase
    .from('strategies')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
}