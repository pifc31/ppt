const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    // Verificar usuario
    const ur = await fetch(SUPABASE_URL + '/auth/v1/user', {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + token },
    });
    const user = await ur.json();
    if (!user.email) return res.status(401).json({ error: 'Token invalido' });

    const { pantalla, datos } = req.body;

    // Obtener progreso actual
    const gr = await fetch(SUPABASE_URL + '/rest/v1/usuarios?email=eq.' + encodeURIComponent(user.email) + '&select=progreso', {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY },
    });
    const rows = await gr.json();
    const progresoActual = (rows[0] && rows[0].progreso) || {};

    const nuevoProgreso = Object.assign({}, progresoActual, {
      [pantalla]: datos,
      ultima_pantalla: String(pantalla),
    });

    await fetch(SUPABASE_URL + '/rest/v1/usuarios?email=eq.' + encodeURIComponent(user.email), {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': 'Bearer ' + SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ progreso: nuevoProgreso }),
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
