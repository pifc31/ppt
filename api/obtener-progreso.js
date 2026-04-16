const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_URL);
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autorizado' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return res.status(401).json({ error: 'Token inválido' });

    const { data: usuario } = await supabase
      .from('usuarios')
      .select('progreso, email, pagado_en')
      .eq('email', user.email)
      .single();

    res.status(200).json({
      email: user.email,
      progreso: usuario?.progreso || {},
      pagado_en: usuario?.pagado_en,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
