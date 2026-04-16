const { createClient } = require('@supabase/supabase-js');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_URL);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No autorizado' });

  const token = authHeader.replace('Bearer ', '');

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );

  try {
    // Verificar token del usuario
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Token inválido' });

    const { pantalla, datos } = req.body;
    if (!pantalla || datos === undefined) {
      return res.status(400).json({ error: 'Falta pantalla o datos' });
    }

    // Obtener progreso actual
    const { data: usuario } = await supabase
      .from('usuarios')
      .select('progreso')
      .eq('email', user.email)
      .single();

    const progresoActual = usuario?.progreso || {};

    // Actualizar progreso con nueva pantalla
    const nuevoProgreso = {
      ...progresoActual,
      [pantalla]: datos,
      ultima_pantalla: pantalla,
      actualizado_en: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('usuarios')
      .update({ progreso: nuevoProgreso })
      .eq('email', user.email);

    if (updateError) throw updateError;

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error guardar-progreso:', err);
    res.status(500).json({ error: err.message });
  }
};
