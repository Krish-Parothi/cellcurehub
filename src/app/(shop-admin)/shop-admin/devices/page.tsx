'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import type { Device } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Smartphone, ChevronDown, Info } from 'lucide-react';

export default function ShopDevicesPage() {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());

  const fetchDevices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('devices').select('*').order('brand').order('model_name');
    setDevices(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { if (user?.role === 'shop_admin') fetchDevices(); }, [user, fetchDevices]);

  const brandGroups = devices.reduce((acc, d) => { (acc[d.brand] ??= []).push(d); return acc; }, {} as Record<string, Device[]>);

  const toggleBrand = (brand: string) => {
    setExpandedBrands(prev => { const n = new Set(prev); n.has(brand) ? n.delete(brand) : n.add(brand); return n; });
  };

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-white">Device Models</h1>
        <p className="text-white/50 text-sm mt-1">View supported devices across the platform</p>
      </motion.div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-blue-400">Read-Only View</p>
          <p className="text-xs text-blue-400/70 mt-1">Device models and categories are managed globally by the main administrator. If you need a new model added, please contact the admin.</p>
        </div>
      </div>

      {loading ? <div className="space-y-4">{[0,1,2].map(i => <Skeleton key={i} className="h-16 w-full bg-white/5 rounded-xl" />)}</div> : (
        <div className="space-y-3">
          {Object.entries(brandGroups).sort(([a], [b]) => a.localeCompare(b)).map(([brand, models]) => (
            <Collapsible key={brand} open={expandedBrands.has(brand)} onOpenChange={() => toggleBrand(brand)}>
              <Card className="bg-white/5 border-white/10">
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-[#00D084]" />
                      <span className="text-white font-semibold">{brand}</span>
                      <Badge variant="outline" className="border-white/20 text-white/40 text-xs">{models.length}</Badge>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${expandedBrands.has(brand) ? 'rotate-180' : ''}`} />
                  </CardContent>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-white/5">
                    {models.map(d => (
                      <div key={d.id} className="flex items-center justify-between px-4 py-3 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm ${d.is_active ? 'text-white' : 'text-white/30 line-through'}`}>{d.model_name}</span>
                          <Badge className="bg-white/10 text-white/40 text-[10px] capitalize">{d.category}</Badge>
                        </div>
                        {!d.is_active && <Badge variant="outline" className="text-red-400 border-red-500/20 bg-red-500/10 text-[10px]">Inactive</Badge>}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
