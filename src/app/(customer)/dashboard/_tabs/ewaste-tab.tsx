'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { EWASTE_CONDITIONS } from '@/lib/types';
import type { Ewaste, EwastePayoutRate, Device } from '@/lib/types';
import DeviceSelector from '@/components/device-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Recycle, Upload, Calendar, IndianRupee, Lock, X } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  valued: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  picked_up: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  credited: 'bg-[#00D084]/20 text-[#00D084] border-[#00D084]/30',
};

export default function EwasteTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<Ewaste[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [manualModel, setManualModel] = useState('');
  const [imei, setImei] = useState('');
  const [condition, setCondition] = useState('');
  const [conditionDesc, setConditionDesc] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const [payoutRate, setPayoutRate] = useState<EwastePayoutRate | null>(null);
  const [showPayout, setShowPayout] = useState(false);
  const [lockingQuote, setLockingQuote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('ewaste').select('*').eq('customer_id', userId).order('created_at', { ascending: false });
    setItems((data as Ewaste[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleDeviceSelect = (device: Device | null, manual?: string) => {
    setSelectedDevice(device);
    setManualModel(manual || '');
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) { toast.error('Max 5 photos'); return; }
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!condition) { toast.error('Please select device condition'); return; }
    if (!imei.match(/^\d{15}$/)) { toast.error('IMEI must be 15 digits'); return; }
    setSubmitting(true);
    try {
      // Upload photos
      let photosUrl = '';
      if (photos.length > 0) {
        const urls: string[] = [];
        for (const photo of photos) {
          const path = `ewaste-images/${userId}/${Date.now()}_${photo.name}`;
          const { error: uploadErr } = await supabase.storage.from('ewaste-images').upload(path, photo);
          if (!uploadErr) {
            const { data: urlData } = supabase.storage.from('ewaste-images').getPublicUrl(path);
            urls.push(urlData.publicUrl);
          }
        }
        photosUrl = urls.join(',');
      }

      const deviceDesc = selectedDevice ? `${selectedDevice.brand} ${selectedDevice.model_name}` : manualModel || 'Unknown Device';

      const { data: ewaste, error } = await supabase.from('ewaste').insert({
        customer_id: userId,
        device_description: deviceDesc,
        device_id: selectedDevice?.id || null,
        imei_number: imei,
        condition,
        condition_description: conditionDesc || null,
        photos_url: photosUrl || null,
        status: 'pending',
      }).select('id').single();

      if (error) throw error;

      // Fetch payout rate
      if (selectedDevice) {
        const { data: rate } = await supabase.from('ewaste_payout_rates').select('*').eq('brand', selectedDevice.brand).eq('model_id', selectedDevice.id).maybeSingle();
        if (rate) { setPayoutRate(rate as EwastePayoutRate); setShowPayout(true); }
        else {
          const { data: brandRate } = await supabase.from('ewaste_payout_rates').select('*').eq('brand', selectedDevice.brand).is('model_id', null).maybeSingle();
          if (brandRate) { setPayoutRate(brandRate as EwastePayoutRate); setShowPayout(true); }
        }
      }

      toast.success('E-waste submission received!');
      // Reset form
      setSelectedDevice(null); setManualModel(''); setImei(''); setCondition(''); setConditionDesc(''); setPhotos([]);
      fetchItems();
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockQuote = async (itemId: string) => {
    if (!payoutRate) return;
    setLockingQuote(itemId);
    await supabase.from('ewaste').update({ status: 'valued', quoted_value: payoutRate.cash_max }).eq('id', itemId);
    toast.success('Quote locked! Pickup will be scheduled.');
    setShowPayout(false);
    setLockingQuote(null);
    fetchItems();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-white mb-6 hidden lg:block">E-Waste Portal</h1>

      {/* Submit Form */}
      <div className="glass rounded-2xl p-6 mb-8">
        <h3 className="text-white font-semibold text-lg mb-1 flex items-center gap-2"><Recycle className="w-5 h-5 text-[#00D084]" />Submit a Device</h3>
        <p className="text-white/50 text-sm mb-4">Get a valuation for your old or broken device</p>
        <div className="space-y-5">
          <DeviceSelector onSelect={handleDeviceSelect} showManualOption selectedDevice={selectedDevice} selectedManualModel={manualModel} />

          <div className="space-y-2">
            <Label className="text-white/80 text-sm">IMEI Number *</Label>
            <Input type="text" maxLength={15} value={imei} onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))} placeholder="15-digit IMEI" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] font-mono" />
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Device Condition *</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {EWASTE_CONDITIONS.map(c => (
                <button key={c.value} type="button" onClick={() => setCondition(c.value)} className={`p-2 rounded-xl border text-xs font-medium transition-all ${condition === c.value ? 'border-[#00D084] bg-[#00D084]/10 text-[#00D084]' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'}`}>{c.label}</button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Condition Description (optional)</Label>
            <Textarea value={conditionDesc} onChange={(e) => setConditionDesc(e.target.value)} placeholder="Any visible damage, issues..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[60px]" />
          </div>

          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Photos (max 5)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                  <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-0 right-0 bg-black/60 rounded-bl p-0.5"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
              {photos.length < 5 && (
                <button onClick={() => fileRef.current?.click()} className="w-16 h-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center hover:border-[#00D084]/50 transition-colors">
                  <Upload className="w-5 h-5 text-white/30" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoChange} />
          </div>

          <Button onClick={handleSubmit} disabled={submitting || !condition || !imei.match(/^\d{15}$/)} className="gradient-green text-[#0A0A0A] font-semibold">{submitting ? 'Submitting...' : 'Get Valuation'}</Button>
        </div>
      </div>

      {/* Payout Display */}
      {showPayout && payoutRate && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-6 mb-6 border border-[#00D084]/20">
          <h3 className="text-white font-semibold mb-3">Estimated Value</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 rounded-xl bg-white/5"><p className="text-xs text-white/40">Cash Payout</p><p className="text-[#00D084] font-bold">₹{payoutRate.cash_min}–₹{payoutRate.cash_max}</p></div>
            <div className="p-3 rounded-xl bg-white/5"><p className="text-xs text-white/40">Store Credit</p><p className="text-[#00D084] font-bold">₹{payoutRate.credit_min}–₹{payoutRate.credit_max}</p></div>
          </div>
          <Button onClick={() => handleLockQuote(items[0]?.id)} disabled={!!lockingQuote} className="w-full gradient-green text-[#0A0A0A] font-semibold"><Lock className="w-4 h-4 mr-2" />{lockingQuote ? 'Locking...' : '🔒 Lock in Quote & Schedule Pickup'}</Button>
        </motion.div>
      )}

      {/* My Submissions */}
      <h3 className="text-white font-semibold mb-4">My Submissions</h3>
      {loading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-white/5" />)}</div> : items.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center"><Recycle className="w-10 h-10 text-white/20 mx-auto mb-3" /><p className="text-white/50 text-sm">No submissions yet</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className="glass glass-hover rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-white text-sm font-medium">{item.device_description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-white/40 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  {item.condition && <span className="text-white/40 text-xs capitalize">• {item.condition.replace('_', ' ')}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.quoted_value != null && <span className="text-[#00D084] text-sm font-semibold flex items-center gap-1"><IndianRupee className="w-3.5 h-3.5" />{item.quoted_value.toLocaleString('en-IN')}</span>}
                <Badge variant="outline" className={STATUS_COLORS[item.status] || 'bg-white/10 text-white/50 border-white/20'}>{item.status.replace('_', ' ')}</Badge>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
