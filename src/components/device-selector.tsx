'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Laptop, Tablet, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DEVICE_BRANDS } from '@/lib/types';
import type { Device } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface DeviceSelectorProps {
  onSelect: (device: Device | null, manualModel?: string) => void;
  showManualOption?: boolean;
  selectedDevice?: Device | null;
  selectedManualModel?: string;
}

function getCategoryIcon(brand: string) {
  const laptopBrands = ['dell', 'hp', 'lenovo', 'asus'];
  if (laptopBrands.includes(brand.toLowerCase())) return Laptop;
  return Smartphone;
}

export default function DeviceSelector({
  onSelect,
  showManualOption = true,
  selectedDevice,
  selectedManualModel,
}: DeviceSelectorProps) {
  const [selectedBrand, setSelectedBrand] = useState('');
  const [models, setModels] = useState<Device[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [manualModel, setManualModel] = useState(selectedManualModel || '');

  // Sync from parent
  useEffect(() => {
    if (selectedDevice) {
      setSelectedBrand(selectedDevice.brand);
    }
  }, [selectedDevice]);

  // Fetch models when brand changes
  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      return;
    }
    setModelsLoading(true);
    setIsManual(false);
    setManualModel('');
    supabase
      .from('devices')
      .select('*')
      .eq('brand', selectedBrand)
      .eq('is_active', true)
      .order('model_name')
      .then(({ data, error }) => {
        setModelsLoading(false);
        if (!error && data) {
          setModels(data as Device[]);
        } else {
          setModels([]);
        }
      });
  }, [selectedBrand]);

  const handleBrandClick = (brand: string) => {
    if (selectedBrand === brand) return;
    setSelectedBrand(brand);
    onSelect(null);
  };

  const handleModelClick = (device: Device) => {
    setIsManual(false);
    onSelect(device);
  };

  const handleManualToggle = () => {
    setIsManual(true);
    onSelect(null);
  };

  const handleManualChange = (val: string) => {
    setManualModel(val);
    if (val.trim().length > 0) {
      onSelect(null, val.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Brand Grid */}
      <div className="space-y-3">
        <Label className="text-white/80 text-sm">Select Brand</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {DEVICE_BRANDS.map((brand) => {
            const Icon = getCategoryIcon(brand);
            const active = selectedBrand === brand;
            return (
              <motion.button
                key={brand}
                type="button"
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleBrandClick(brand)}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border transition-all duration-200 ${
                  active
                    ? 'border-[#00D084] bg-[#00D084]/10 green-glow'
                    : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                }`}
              >
                <Icon
                  className={`w-5 h-5 sm:w-6 sm:h-6 ${
                    active ? 'text-[#00D084]' : 'text-white/60'
                  }`}
                />
                <span
                  className={`text-[11px] sm:text-xs font-medium leading-tight text-center ${
                    active ? 'text-[#00D084]' : 'text-white/60'
                  }`}
                >
                  {brand}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Model Grid */}
      <AnimatePresence>
        {selectedBrand && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <Label className="text-white/80 text-sm">Select Model</Label>

            {modelsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl bg-white/5" />
                ))}
              </div>
            ) : models.length === 0 && !isManual ? (
              <div className="text-center py-6">
                <p className="text-white/40 text-sm mb-3">
                  No models found for {selectedBrand}
                </p>
                {showManualOption && (
                  <button
                    type="button"
                    onClick={handleManualToggle}
                    className="text-[#00D084] text-sm font-medium hover:underline"
                  >
                    Enter model manually
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-1">
                  {models.map((model) => {
                    const active = selectedDevice?.id === model.id && !isManual;
                    return (
                      <motion.button
                        key={model.id}
                        type="button"
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleModelClick(model)}
                        className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                          active
                            ? 'border-[#00D084] bg-[#00D084]/10 green-glow'
                            : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            active ? 'text-[#00D084]' : 'text-white/70'
                          }`}
                        >
                          {model.model_name}
                        </span>
                        <span className="block text-xs text-white/40 capitalize mt-1">
                          {model.category}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Manual model option */}
                {showManualOption && !isManual && models.length > 0 && (
                  <button
                    type="button"
                    onClick={handleManualToggle}
                    className="text-[#00D084] text-sm font-medium hover:underline mt-2"
                  >
                    My model isn&apos;t listed
                  </button>
                )}
              </>
            )}

            {/* Manual model input */}
            <AnimatePresence>
              {isManual && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Label className="text-white/80 text-sm">
                      Enter Model Name
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManual(false);
                        setManualModel('');
                        onSelect(null);
                      }}
                      className="text-white/40 hover:text-white/60"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder="e.g. iPhone 15 Pro Max"
                    value={manualModel}
                    onChange={(e) => handleManualChange(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084]"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
