const supabase = require('./supabase');

module.exports = async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

    if (req.method === 'GET') {
      await getStatistics(req, res, user.id);
    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

async function getStatistics(req, res, userId) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const total_bets = data.length;
  const win_count = data.filter(m => m.result === 'win').length;
  const profit = data.reduce((acc, m) => {
    if (m.result === 'win') {
      return acc + (m.betting_amount * m.odds - m.betting_amount);
    } else if (m.result === 'lose') {
      return acc - m.betting_amount;
    }
    return acc;
  }, 0);

  res.json({ 
    success: true, 
    statistics: { total_bets, win_count, profit } 
  });
}