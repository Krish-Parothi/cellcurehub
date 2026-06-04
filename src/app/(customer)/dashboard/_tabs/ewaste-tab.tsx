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
import { Recycle, Upload, Calendar, IndianRupee, Lock, X, Check, XCircle } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  admin_offered: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  agreed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  valued: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  picked_up: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  credited: 'bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/20',
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
  const [address, setAddress] = useState('');
  const [requestedPrice, setRequestedPrice] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    // Don't show rejected items in the active list, or maybe just fade them out. We'll fetch all.
    const { data } = await supabase.from('ewaste').select('*').eq('customer_id', userId).order('created_at', { ascending: false });
    // Filter out rejected if you don't want to see them, but we'll show them for transparency
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
    if (!address.trim()) { toast.error('Please provide a pickup address'); return; }
    if (!requestedPrice || isNaN(Number(requestedPrice))) { toast.error('Please enter a valid requested price'); return; }
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
        address: address,
        requested_price: Number(requestedPrice),
        status: 'pending',
      }).select('id').single();

      if (error) throw error;

      toast.success('E-waste submission received! Admin will review your price.');
      // Reset form
      setSelectedDevice(null); setManualModel(''); setImei(''); setCondition(''); setConditionDesc(''); setPhotos([]);
      setAddress(''); setRequestedPrice('');
      fetchItems();
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNegotiationResponse = async (itemId: string, agree: boolean) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (!item) return;

      const payload = agree 
        ? { status: 'agreed', customer_agreed: true, quoted_value: item.admin_offer }
        : { status: 'rejected', customer_agreed: false };

      const { error } = await supabase.from('ewaste').update(payload).eq('id', itemId);
      if (error) throw error;
      
      toast.success(agree ? 'Offer accepted! We will schedule a pickup.' : 'Offer declined. The submission is closed.');
      fetchItems();
    } catch (err) {
      toast.error('Failed to update submission');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 hidden lg:block">E-Waste Portal</h1>
 
      {/* Submit Form */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1 flex items-center gap-2"><Recycle className="w-5 h-5 text-[#FF5C00]" />Submit a Device</h3>
        <p className="text-[#1A1A1A]/60 text-sm mb-4">Propose your price for your old or broken device</p>
        <div className="space-y-5">
          <DeviceSelector onSelect={handleDeviceSelect} showManualOption selectedDevice={selectedDevice} selectedManualModel={manualModel} />
 
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/80 text-sm">IMEI Number *</Label>
              <Input type="text" maxLength={15} value={imei} onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))} placeholder="15-digit IMEI" className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00] font-mono" />
            </div>
            
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/80 text-sm">Your Requested Price (₹) *</Label>
              <Input type="number" value={requestedPrice} onChange={(e) => setRequestedPrice(e.target.value)} placeholder="e.g. 5000" className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00]" />
            </div>
          </div>
 
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]/80 text-sm">Device Condition *</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {EWASTE_CONDITIONS.map(c => (
                <button key={c.value} type="button" onClick={() => setCondition(c.value)} className={`p-2 rounded-xl border text-xs font-medium transition-all ${condition === c.value ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-[#FF5C00]' : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300'}`}>{c.label}</button>
              ))}
            </div>
          </div>
 
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]/80 text-sm">Pickup Address *</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address for device pickup..." className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00] min-h-[60px]" />
          </div>

          <div className="space-y-2">
            <Label className="text-[#1A1A1A]/80 text-sm">Condition Description (optional)</Label>
            <Textarea value={conditionDesc} onChange={(e) => setConditionDesc(e.target.value)} placeholder="Any visible damage, issues..." className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00] min-h-[60px]" />
          </div>
 
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]/80 text-sm">Photos (max 5)</Label>
            <div className="flex flex-wrap gap-2">
              {photos.map((p, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
                  <img src={URL.createObjectURL(p)} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => removePhoto(i)} className="absolute top-0 right-0 bg-black/60 rounded-bl p-0.5"><X className="w-3 h-3 text-white" /></button>
                </div>
              ))}
              {photos.length < 5 && (
                <button onClick={() => fileRef.current?.click()} className="w-16 h-16 rounded-lg border border-dashed border-gray-300 flex items-center justify-center hover:border-[#FF5C00]/50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={handlePhotoChange} />
          </div>
 
          <Button onClick={handleSubmit} disabled={submitting || !condition || !imei.match(/^\d{15}$/)} className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold">{submitting ? 'Submitting...' : 'Submit Device & Request Price'}</Button>
        </div>
      </div>
 
      {/* My Submissions */}
      <h3 className="text-[#1A1A1A] font-semibold mb-4">My Submissions</h3>
      {loading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-[#1A1A1A]/5" />)}</div> : items.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-10 text-center shadow-sm"><Recycle className="w-10 h-10 text-[#1A1A1A]/20 mx-auto mb-3" /><p className="text-[#1A1A1A]/60 text-sm">No submissions yet</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className={`bg-white border border-[#E8E4DF] rounded-xl p-5 shadow-sm transition-shadow duration-200 ${item.status === 'rejected' ? 'opacity-60' : 'hover:shadow-md'}`}>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <p className="text-[#1A1A1A] text-sm font-medium">{item.device_description}</p>
                  <div className="flex items-center gap-2 mt-1 mb-2">
                    <span className="text-[#1A1A1A]/60 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    {item.condition && <span className="text-[#1A1A1A]/60 text-xs capitalize">• {item.condition.replace('_', ' ')}</span>}
                  </div>
                  {item.requested_price != null && (
                    <p className="text-sm text-[#1A1A1A]/80 mb-1">
                      You requested: <span className="font-semibold">₹{item.requested_price}</span>
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={STATUS_COLORS[item.status] || 'bg-white/10 text-white/50 border-white/20'}>{item.status.replace('_', ' ')}</Badge>
                  {item.quoted_value != null && <span className="text-[#FF5C00] text-sm font-semibold flex items-center gap-1 mt-1"><IndianRupee className="w-3.5 h-3.5" />{item.quoted_value.toLocaleString('en-IN')} Final</span>}
                </div>
              </div>

              {/* Negotiation Box */}
              {item.status === 'admin_offered' && item.admin_offer != null && (
                <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                  <p className="text-sm text-indigo-900 mb-3">
                    Admin made a counter-offer for your device: <span className="font-bold text-indigo-700">₹{item.admin_offer}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={() => handleNegotiationResponse(item.id, true)} className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none">
                      <Check className="w-4 h-4 mr-2" /> Agree & Proceed
                    </Button>
                    <Button onClick={() => handleNegotiationResponse(item.id, false)} variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 flex-1 sm:flex-none">
                      <XCircle className="w-4 h-4 mr-2" /> Disagree
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
