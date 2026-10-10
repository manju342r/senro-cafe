import { cafeClient, cors, getBearer } from './_cafe.js';

// POST /api/ai-approve { id, action: 'approved' | 'rejected' | 'implemented' }
// Staff only. Records the owner's decision on a recommendation (memory write);
// implemented stamps implemented_at so outcome evaluation has a start point.
export default async function handler(req, res) {
  cors(res, 'POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });

  const bearer = getBearer(req);
  if (!bearer) return res.status(401).json({ error: 'auth_required' });

  const { id, action } = req.body ?? {};
  if (!id || !['approved', 'rejected', 'implemented'].includes(action)) {
    return res.status(400).json({ error: 'invalid_action' });
  }

  try {
    const supabase = cafeClient(bearer);
    const { data: me } = await supabase.auth.getUser();
    if (!me?.user) return res.status(401).json({ error: 'auth_required' });

    const patch = { status: action };
    if (action === 'approved') {
      patch.approved_by = me.user.id;
      patch.approved_at = new Date().toISOString();
    }
    if (action === 'implemented') patch.implemented_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('recommendations')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json({ recommendation: data });
  } catch (e) {
    const msg = e?.message ?? '';
    if (/JWT|auth/i.test(msg)) return res.status(403).json({ error: 'forbidden' });
    console.error('[ai-approve]', e);
    return res.status(500).json({ error: 'decision_failed' });
  }
}
