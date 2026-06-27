'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Laptop, Tablet, Search, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
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
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [models, setModels] = useState<Device[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [manualModel, setManualModel] = useState(selectedManualModel || '');

  // Fetch unique active brands on mount
  useEffect(() => {
    supabase
      .from('devices')
      .select('brand')
      .eq('is_active', true)
      .then(({ data }) => {
        if (data) {
          const uniqueBrands = Array.from(new Set(data.map(d => d.brand))).sort();
          setAvailableBrands(uniqueBrands);
        }
        setBrandsLoading(false);
      });
  }, []);

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
        <Label className="text-[#1A1A1A]/80 text-sm">Select Brand</Label>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {brandsLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-xl bg-[#1A1A1A]/5" />
            ))
          ) : availableBrands.length === 0 ? (
            <div className="col-span-full text-center py-4 text-[#1A1A1A]/50 text-sm">No active brands found</div>
          ) : (
            availableBrands.map((brand) => {
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
                      ? 'border-[#FF5C00] bg-[#FF5C00]/5 text-[#FF5C00]'
                      : 'border-[#E8E4DF] bg-[#F7F7F5] hover:border-[#FF5C00]/30 hover:bg-white text-[#1A1A1A]'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${active ? 'text-[#FF5C00]' : 'text-[#1A1A1A]/40'}`} strokeWidth={active ? 2 : 1.5} />
                  <span className={`text-xs sm:text-sm font-medium text-center ${active ? 'text-[#FF5C00]' : 'text-[#1A1A1A]/70'}`}>{brand}</span>
                </motion.button>
              );
            })
          )}
        </div>
        {showManualOption && availableBrands.length > 0 && !isManual && !selectedBrand && (
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => {
                setSelectedBrand('');
                setIsManual(true);
                onSelect(null);
              }}
              className="text-[#FF5C00] text-sm font-medium hover:underline"
            >
              Brand not listed?
            </button>
          </div>
        )}
      </div>

      {/* Step 2: Select Model or Manual Input */}
      <AnimatePresence mode="wait">
        {(selectedBrand || isManual) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
          >
            <Label className="text-[#1A1A1A]/80 text-sm">Select Model</Label>

            {modelsLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl bg-[#F7F7F5]" />
                ))}
              </div>
            ) : models.length === 0 && !isManual ? (
              <div className="text-center py-6">
                <p className="text-[#1A1A1A]/40 text-sm mb-3">
                  No models found for {selectedBrand}
                </p>
                {showManualOption && (
                  <button
                    type="button"
                    onClick={handleManualToggle}
                    className="text-[#FF5C00] text-sm font-medium hover:underline"
                  >
                    Enter model manually
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[280px] overflow-y-auto pr-1" data-lenis-prevent="true">
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
                            ? 'border-[#FF5C00] bg-[#FF5C00]/10 shadow-sm'
                            : 'border-[#E8E4DF] bg-[#F7F7F5] hover:border-[#E8E4DF]/80 hover:bg-[#E8E4DF]/20'
                        }`}
                      >
                        <span
                          className={`text-sm font-medium ${
                            active ? 'text-[#FF5C00]' : 'text-[#1A1A1A]/70'
                          }`}
                        >
                          {model.model_name}
                        </span>
                        <span className="block text-xs text-[#1A1A1A]/40 capitalize mt-1">
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
                    className="text-[#FF5C00] text-sm font-medium hover:underline mt-2"
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
                    <Label className="text-[#1A1A1A]/80 text-sm">
                      Enter Model Name
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsManual(false);
                        setManualModel('');
                        onSelect(null);
                      }}
                      className="text-[#1A1A1A]/40 hover:text-[#1A1A1A]/60"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <Input
                    type="text"
                    placeholder={selectedBrand ? `e.g. ${selectedBrand} Model Name` : 'e.g. Motorola Edge 50 Pro'}
                    value={manualModel}
                    onChange={(e) => handleManualChange(e.target.value)}
                    className="bg-white border-[#E8E4DF] text-[#1A1A1A] placeholder:text-[#1A1A1A]/30 focus-visible:ring-[#FF5C00]"
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
