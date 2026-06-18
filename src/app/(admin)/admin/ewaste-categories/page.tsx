'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useAuthFetch } from '@/lib/hooks/use-auth-fetch';
import type { EwasteItemCategory } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tags, Plus, Pencil, Trash2, Loader2, GripVertical } from 'lucide-react';

export default function EwasteCategoriesPage() {
  const [categories, setCategories] = useState<EwasteItemCategory[]>([]);
  
  // Dialog
  const [editDialog, setEditDialog] = useState<{ open: boolean; category: EwasteItemCategory | null }>({ open: false, category: null });
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteConfirm, setDeleteConfirm] = useState<EwasteItemCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = useCallback(async () => {
    const { data, error } = await supabase
      .from('ewaste_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) toast.error('Failed to load categories');
    setCategories((data as EwasteItemCategory[]) || []);
  }, []);

  const { loading } = useAuthFetch(fetchData, {
    requiredRole: 'admin',
    realtimeTable: 'ewaste_categories',
  });

  const openAdd = () => {
    setForm({ name: '', description: '' });
    setEditDialog({ open: true, category: null });
  };

  const openEdit = (cat: EwasteItemCategory) => {
    setForm({ name: cat.name, description: cat.description || '' });
    setEditDialog({ open: true, category: cat });
  };

  const saveCategory = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      if (editDialog.category) {
        // Update
        const { error } = await supabase.from('ewaste_categories').update({
          name: form.name.trim(),
          description: form.description.trim() || null,
        }).eq('id', editDialog.category.id);
        if (error) throw error;
        toast.success('Category updated');
      } else {
        // Create
        const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0;
        const { error } = await supabase.from('ewaste_categories').insert({
          name: form.name.trim(),
          description: form.description.trim() || null,
          sort_order: maxOrder + 1,
        });
        if (error) throw error;
        toast.success('Category added');
      }
      setEditDialog({ open: false, category: null });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (cat: EwasteItemCategory) => {
    const { error } = await supabase.from('ewaste_categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    if (error) toast.error('Failed to toggle');
    else { toast.success(cat.is_active ? 'Deactivated' : 'Activated'); fetchData(); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from('ewaste_categories').delete().eq('id', deleteConfirm.id);
      if (error) throw error;
      toast.success('Category deleted');
      setDeleteConfirm(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const moveCategory = async (cat: EwasteItemCategory, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    
    const other = categories[swapIdx];
    await Promise.all([
      supabase.from('ewaste_categories').update({ sort_order: other.sort_order }).eq('id', cat.id),
      supabase.from('ewaste_categories').update({ sort_order: cat.sort_order }).eq('id', other.id),
    ]);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]">E-Waste Categories</h1>
          <p className="text-[#1A1A1A]/50 text-sm mt-1">Manage the types of e-waste items customers can sell</p>
        </div>
        <Button onClick={openAdd} className="bg-[#FF5C00] hover:bg-[#e05200] text-white font-semibold">
          <Plus className="w-4 h-4 mr-1.5" /> Add Category
        </Button>
      </motion.div>

      <Card className="bg-white border-[#E8E4DF] shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6"><Skeleton className="h-48 w-full bg-[#1A1A1A]/5" /></div>
          ) : categories.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center">
              <Tags className="w-12 h-12 text-[#1A1A1A]/20 mb-4" />
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No categories yet</h3>
              <p className="text-[#1A1A1A]/50 text-sm mb-4">Add categories like "Used Batteries", "Broken Screens", etc.</p>
              <Button onClick={openAdd} className="bg-[#FF5C00] text-white hover:bg-[#e05200]"><Plus className="w-4 h-4 mr-1" /> Add First Category</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E8E4DF] hover:bg-transparent">
                    <TableHead className="text-[#1A1A1A]/50 font-medium w-10">#</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Name</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Description</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Active</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium">Order</TableHead>
                    <TableHead className="text-[#1A1A1A]/50 font-medium text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((cat, idx) => (
                    <TableRow key={cat.id} className="border-[#E8E4DF] hover:bg-[#F7F7F5]">
                      <TableCell className="text-[#1A1A1A]/40 text-sm">{idx + 1}</TableCell>
                      <TableCell className="text-[#1A1A1A] font-semibold">{cat.name}</TableCell>
                      <TableCell className="text-[#1A1A1A]/60 text-sm max-w-xs truncate">{cat.description || '—'}</TableCell>
                      <TableCell>
                        <Switch checked={cat.is_active} onCheckedChange={() => toggleActive(cat)} />
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" disabled={idx === 0} onClick={() => moveCategory(cat, 'up')} className="h-7 w-7 p-0 text-[#1A1A1A]/40">↑</Button>
                          <Button size="sm" variant="ghost" disabled={idx === categories.length - 1} onClick={() => moveCategory(cat, 'down')} className="h-7 w-7 p-0 text-[#1A1A1A]/40">↓</Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(cat)} className="h-8 text-[#1A1A1A]/70 hover:text-[#FF5C00] hover:bg-[#FF5C00]/10">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm(cat)} className="h-8 text-red-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={editDialog.open} onOpenChange={o => setEditDialog({ open: o, category: o ? editDialog.category : null })}>
        <DialogContent className="bg-white border-[#E8E4DF] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1A1A1A]">{editDialog.category ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription className="text-[#1A1A1A]/50">
              {editDialog.category ? 'Update this e-waste category' : 'Add a new type of e-waste item customers can sell'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[#1A1A1A]/70">Name *</Label>
              <Input value={form.name} onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="e.g. Used Batteries" className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1" />
            </div>
            <div>
              <Label className="text-[#1A1A1A]/70">Description</Label>
              <Textarea value={form.description} onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Brief description..." className="bg-white border-[#E8E4DF] text-[#1A1A1A] focus-visible:ring-[#FF5C00] mt-1 min-h-[60px]" />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={saveCategory} disabled={saving} className="bg-[#FF5C00] text-white hover:bg-[#FF5C00]/90">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editDialog.category ? 'Save Changes' : 'Add Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={open => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="bg-white border-[#E8E4DF]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1A1A1A]">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#1A1A1A]/60">
              This will permanently delete <span className="text-[#1A1A1A] font-bold">{deleteConfirm?.name}</span>. Existing e-waste submissions using this category will keep their data but won't show the category name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-[#E8E4DF] text-[#1A1A1A]/60 hover:bg-black/5">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
              {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Trash2 className="w-4 h-4 mr-1" />}Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
