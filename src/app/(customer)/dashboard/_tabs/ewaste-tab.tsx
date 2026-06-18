'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import type { Ewaste, EwasteItemCategory } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Recycle, Upload, Calendar, IndianRupee, X, Check, XCircle } from 'lucide-react';
import { compressImage } from '@/lib/compress-image';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  admin_offered: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  agreed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  rejected: 'bg-red-500/10 text-red-600 border-red-500/20',
  pickup_assigned: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
  picked_up: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  credited: 'bg-[#FF5C00]/10 text-[#FF5C00] border-[#FF5C00]/20',
};

export default function EwasteTab({ userId }: { userId: string }) {
  const [items, setItems] = useState<Ewaste[]>([]);
  const [categories, setCategories] = useState<EwasteItemCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  // Form state
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [conditionDesc, setConditionDesc] = useState('');
  const [address, setAddress] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    const [itemsRes, catsRes] = await Promise.all([
      supabase.from('ewaste')
        .select('*, ewaste_category:ewaste_categories(*)')
        .eq('customer_id', userId)
        .eq('category', 'ewaste')
        .order('created_at', { ascending: false }),
      supabase.from('ewaste_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
    ]);
    setItems((itemsRes.data as any[]) || []);
    setCategories((catsRes.data as EwasteItemCategory[]) || []);
  }, [userId]);

  const { loading } = useAuthFetch(fetchItems, {
    realtimeTable: 'ewaste',
    realtimeFilter: `customer_id=eq.${userId}`
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 5) { toast.error('Max 5 photos'); return; }
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (idx: number) => setPhotos(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (!selectedCategoryId) { toast.error('Please select an e-waste category'); return; }
    if (selectedCategoryId === 'other' && !customDescription.trim()) { toast.error('Please describe your item'); return; }
    if (!address.trim()) { toast.error('Please provide a pickup address'); return; }
    if (photos.length === 0) { toast.error('Please upload at least one photo'); return; }
    setSubmitting(true);
    try {
      // Upload photos
      const urls: string[] = [];
      for (const photo of photos) {
        const compressed = await compressImage(photo);
        const path = `ewaste-images/${userId}/${Date.now()}_${compressed.name}`;
        const { error: uploadErr } = await supabase.storage.from('e-waste images').upload(path, compressed);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('e-waste images').getPublicUrl(path);
          urls.push(urlData.publicUrl);
        }
      }

      const selectedCat = categories.find(c => c.id === selectedCategoryId);
      const deviceDesc = selectedCategoryId === 'other'
        ? customDescription
        : selectedCat?.name || 'E-Waste Item';

      const { error } = await supabase.from('ewaste').insert({
        customer_id: userId,
        device_description: deviceDesc,
        condition_description: conditionDesc || null,
        photos_url: urls.join(',') || null,
        address,
        status: 'pending',
        category: 'ewaste',
        ewaste_category_id: selectedCategoryId === 'other' ? null : selectedCategoryId,
      }).select('id').single();

      if (error) {
        console.error('E-waste insert error:', error);
        throw error;
      }

      toast.success('E-waste submission received! Admin will review and send you a price.');
      setSelectedCategoryId(''); setCustomDescription(''); setConditionDesc(''); setPhotos([]);
      setAddress('');
      fetchItems();
    } catch (err) {
      toast.error('Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespond = async (itemId: string, agree: boolean) => {
    setRespondingId(itemId);
    try {
      const { error } = await supabase.from('ewaste').update({
        customer_agreed: agree,
        status: agree ? 'agreed' : 'rejected',
      }).eq('id', itemId);
      if (error) throw error;
      toast.success(agree ? 'You accepted the offer!' : 'Offer declined');
      fetchItems();
    } catch (err) {
      toast.error('Failed to respond');
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-bold text-[#1A1A1A] mb-6 hidden lg:block">Sell E-Waste</h1>
 
      {/* Submit Form */}
      <div className="bg-white border border-[#E8E4DF] rounded-2xl p-6 mb-8 shadow-sm">
        <h3 className="text-[#1A1A1A] font-semibold text-lg mb-1 flex items-center gap-2">
          <Recycle className="w-5 h-5 text-[#FF5C00]" />
          Sell Your E-Waste
        </h3>
        <p className="text-[#1A1A1A]/60 text-sm mb-4">
          Submit used batteries, broken parts, or any old electronics. Upload photos and we'll send you a price offer.
        </p>
        <div className="space-y-5">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]/80 text-sm">Item Category *</Label>
            <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
              <SelectTrigger className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A]">
                <SelectValue placeholder="What are you selling?" />
              </SelectTrigger>
              <SelectContent className="bg-white text-[#1A1A1A] border-[#E8E4DF]">
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                    {cat.description && <span className="text-[#1A1A1A]/40 ml-2 text-xs">— {cat.description}</span>}
                  </SelectItem>
                ))}
                <SelectItem value="other">🔧 Other (not listed above)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Custom description when "Other" is selected */}
          {selectedCategoryId === 'other' && (
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/80 text-sm">Describe Your Item *</Label>
              <Textarea value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="What e-waste item are you selling?" className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00] min-h-[60px]" />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[#1A1A1A]/80 text-sm">Condition & Details (optional)</Label>
            <Textarea value={conditionDesc} onChange={(e) => setConditionDesc(e.target.value)} placeholder="Describe the condition, quantity, any issues..." className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00] min-h-[60px]" />
          </div>

          <div className="space-y-2">
            <Label className="text-[#1A1A1A]/80 text-sm">Pickup Address *</Label>
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full address for pickup..." className="bg-[#F7F7F5] border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00] min-h-[60px]" />
          </div>
 
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label className="text-[#1A1A1A]/80 text-sm">Photos * (at least 1, max 5)</Label>
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
 
          <Button onClick={handleSubmit} disabled={submitting || !selectedCategoryId || photos.length === 0} className="bg-[#FF5C00] hover:bg-[#FF5C00]/90 text-white font-semibold">
            {submitting ? 'Submitting...' : 'Submit E-Waste'}
          </Button>
        </div>
      </div>
 
      {/* My Submissions */}
      <h3 className="text-[#1A1A1A] font-semibold mb-4">My E-Waste Submissions</h3>
      {loading ? <div className="space-y-3">{[1,2].map(i => <Skeleton key={i} className="h-20 rounded-xl bg-[#1A1A1A]/5" />)}</div> : items.length === 0 ? (
        <div className="bg-white border border-[#E8E4DF] rounded-2xl p-10 text-center shadow-sm"><Recycle className="w-10 h-10 text-[#1A1A1A]/20 mx-auto mb-3" /><p className="text-[#1A1A1A]/60 text-sm">No submissions yet</p></div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }} className="bg-white border border-[#E8E4DF] rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[#1A1A1A] text-sm font-medium">{item.device_description}</p>
                    {item.ewaste_category && (
                      <Badge variant="outline" className="text-[10px] bg-[#F7F7F5]">{item.ewaste_category.name}</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[#1A1A1A]/60 text-xs flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  {item.condition_description && (
                    <p className="text-[#1A1A1A]/50 text-xs mt-2">{item.condition_description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="outline" className={STATUS_COLORS[item.status] || 'bg-white/10'}>{item.status.replace(/_/g, ' ')}</Badge>
                  {item.admin_offer != null && (
                    <span className="text-[#FF5C00] text-sm font-semibold flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5" />{item.admin_offer.toLocaleString('en-IN')} offered
                    </span>
                  )}
                </div>
              </div>

              {/* Accept/Deny buttons when admin has offered a price */}
              {item.status === 'admin_offered' && item.admin_offer != null && (
                <div className="mt-4 pt-4 border-t border-[#E8E4DF]">
                  <div className="bg-orange-50 border border-orange-100 rounded-xl p-4">
                    <p className="text-sm text-orange-900 font-medium mb-3">
                      Admin has offered <span className="text-[#FF5C00] font-bold">₹{item.admin_offer.toLocaleString('en-IN')}</span> for this item. Do you accept?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(item.id, true)}
                        disabled={respondingId === item.id}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRespond(item.id, false)}
                        disabled={respondingId === item.id}
                        className="border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-1" /> Decline
                      </Button>
                    </div>
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
