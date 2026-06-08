'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Clock, Plus, Edit2, Trash2 } from 'lucide-react';

export default function TimeSlotsPage() {
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [slotKey, setSlotKey] = useState('');
  const [label, setLabel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sortOrder, setSortOrder] = useState('0');

  const fetchTimeSlots = useCallback(async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('sort_order', { ascending: true });
    
    if (error) {
      toast.error('Failed to load time slots');
      return;
    }
    setTimeSlots(data || []);
  }, []);

  const { loading } = useAuthFetch(fetchTimeSlots, {
    requiredRole: 'admin',
    realtimeTable: 'time_slots',
  });

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('time_slots')
      .update({ is_active: !currentStatus })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(currentStatus ? 'Slot disabled' : 'Slot enabled');
      fetchTimeSlots();
    }
  };

  const openModal = (slot: any = null) => {
    if (slot) {
      setEditingSlot(slot);
      setSlotKey(slot.slot_key);
      setLabel(slot.label);
      setStartTime(slot.start_time.slice(0, 5)); // Remove seconds
      setEndTime(slot.end_time.slice(0, 5));
      setSortOrder(slot.sort_order.toString());
    } else {
      setEditingSlot(null);
      setSlotKey('');
      setLabel('');
      setStartTime('');
      setEndTime('');
      setSortOrder('0');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!slotKey || !label || !startTime || !endTime) {
      toast.error('Please fill all required fields');
      return;
    }

    setSaving(true);
    const payload = {
      slot_key: slotKey.toLowerCase().replace(/\s+/g, '_'),
      label,
      start_time: startTime,
      end_time: endTime,
      sort_order: parseInt(sortOrder) || 0,
    };

    if (editingSlot) {
      const { error } = await supabase.from('time_slots').update(payload).eq('id', editingSlot.id);
      if (error) toast.error('Failed to update slot: ' + error.message);
      else toast.success('Slot updated successfully');
    } else {
      const { error } = await supabase.from('time_slots').insert(payload);
      if (error) toast.error('Failed to create slot: ' + error.message);
      else toast.success('Slot created successfully');
    }

    setSaving(false);
    setModalOpen(false);
    fetchTimeSlots();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;
    
    const { error } = await supabase.from('time_slots').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete slot');
    } else {
      toast.success('Slot deleted');
      fetchTimeSlots();
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF5C00]" /></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">Manage Time Slots</h1>
          <p className="text-[#1A1A1A]/60 text-sm mt-1">Configure available booking windows for customers</p>
        </div>
        <Button onClick={() => openModal()} className="bg-[#FF5C00] hover:bg-[#e05200] text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add New Slot
        </Button>
      </motion.div>

      <Card className="border-[#E8E4DF] shadow-sm">
        <Table>
          <TableHeader className="bg-[#F7F7F5]">
            <TableRow>
              <TableHead className="w-[80px]">Order</TableHead>
              <TableHead>Label</TableHead>
              <TableHead>Time Range</TableHead>
              <TableHead>Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timeSlots.map((slot) => (
              <TableRow key={slot.id} className="hover:bg-[#F7F7F5]/50 transition-colors">
                <TableCell className="font-medium text-[#1A1A1A]/60">{slot.sort_order}</TableCell>
                <TableCell className="font-semibold text-[#1A1A1A]">{slot.label}</TableCell>
                <TableCell className="text-[#1A1A1A]/70 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                </TableCell>
                <TableCell className="text-[#1A1A1A]/50 font-mono text-xs">{slot.slot_key}</TableCell>
                <TableCell>
                  <Switch 
                    checked={slot.is_active} 
                    onCheckedChange={() => handleToggleActive(slot.id, slot.is_active)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openModal(slot)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(slot.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 ml-2">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {timeSlots.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-[#1A1A1A]/50">
                  No time slots configured. Add one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white border-[#E8E4DF] text-[#1A1A1A]">
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Edit Time Slot' : 'Add Time Slot'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label" className="text-xs font-semibold text-[#1A1A1A]/60">Label (Display Name)</Label>
              <Input id="label" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Morning 9 AM - 12 PM" className="border-[#E8E4DF] focus-visible:ring-[#FF5C00]" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="slotKey" className="text-xs font-semibold text-[#1A1A1A]/60">Unique Key</Label>
              <Input id="slotKey" value={slotKey} onChange={e => setSlotKey(e.target.value)} disabled={!!editingSlot} placeholder="e.g. morning" className="border-[#E8E4DF] focus-visible:ring-[#FF5C00]" />
              <p className="text-[10px] text-[#1A1A1A]/40">Must be unique, lowercase, no spaces.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="startTime" className="text-xs font-semibold text-[#1A1A1A]/60">Start Time</Label>
                <Input id="startTime" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="border-[#E8E4DF] focus-visible:ring-[#FF5C00]" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endTime" className="text-xs font-semibold text-[#1A1A1A]/60">End Time</Label>
                <Input id="endTime" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="border-[#E8E4DF] focus-visible:ring-[#FF5C00]" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sortOrder" className="text-xs font-semibold text-[#1A1A1A]/60">Sort Order</Label>
              <Input id="sortOrder" type="number" value={sortOrder} onChange={e => setSortOrder(e.target.value)} placeholder="0" className="border-[#E8E4DF] focus-visible:ring-[#FF5C00]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={saving} className="border-[#E8E4DF]">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#FF5C00] hover:bg-[#e05200] text-white">
              {saving ? 'Saving...' : 'Save Slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
