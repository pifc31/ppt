const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    const ur = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + token },
    });
    const user = await ur.json();
    if (!user.email) return res.status(401).json({ error: 'Token invalido' });
    const gr = await fetch(SUPABASE_URL + '/rest/v1/usuarios?email=eq.' + encodeURIComponent(user.email) + '&select=progreso,pagado_en', {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY },
    });
    const rows = await gr.json();
    res.status(200).json({
      email: user.email,
      progreso: (rows[0] && rows[0].progreso) || {},
      pagado_en: rows[0] && rows[0].pagado_en,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
