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
        await getMatches(req, res, user.id);
        break;
      case 'POST':
        await createMatch(req, res, user.id);
        break;
      case 'DELETE':
        await deleteMatch(req, res, user.id);
        break;
      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Matches error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

async function getMatches(req, res, userId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', userId)
    .order('match_date', { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, matches: data });
}

async function createMatch(req, res, userId) {
  const { match_date, league, home_team, away_team, betting_amount, odds, result } = req.body;

  const { data, error } = await supabase
    .from('matches')
    .insert([{
      user_id: userId,
      match_date,
      league,
      home_team,
      away_team,
      betting_amount,
      odds,
      result
    }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true, match: data[0] });
}

async function deleteMatch(req, res, userId) {
  const { id } = req.query;

  const { data, error } = await supabase
    .from('matches')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ success: true });
}