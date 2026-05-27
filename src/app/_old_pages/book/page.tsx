'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Laptop,
  Check,
  MapPin,
  Clock,
  Store,
  Truck,
  Wrench,
  Battery,
  Monitor,
  Droplets,
  HardDrive,
  Camera,
  Mic,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NAGPUR_AREAS } from '@/lib/types';
import type { Device } from '@/lib/types';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// --- Constants ---

const BRANDS = [
  'Apple',
  'Samsung',
  'OnePlus',
  'Xiaomi',
  'Vivo',
  'Oppo',
  'Realme',
  'Google',
  'Nothing',
  'Asus',
  'HP',
  'Lenovo',
  'Dell',
];

const REPAIR_TYPES = [
  {
    id: 'screen',
    label: 'Screen Replacement',
    icon: Monitor,
    priceMin: 999,
    priceMax: 14999,
  },
  {
    id: 'battery',
    label: 'Battery Replacement',
    icon: Battery,
    priceMin: 499,
    priceMax: 3999,
  },
  {
    id: 'charging',
    label: 'Charging Port',
    icon: Wrench,
    priceMin: 299,
    priceMax: 2499,
  },
  {
    id: 'water',
    label: 'Water Damage',
    icon: Droplets,
    priceMin: 1499,
    priceMax: 7999,
  },
  {
    id: 'software',
    label: 'Software Issue',
    icon: HardDrive,
    priceMin: 299,
    priceMax: 1999,
  },
  {
    id: 'motherboard',
    label: 'Motherboard',
    icon: Wrench,
    priceMin: 2999,
    priceMax: 12999,
  },
  {
    id: 'camera',
    label: 'Camera Repair',
    icon: Camera,
    priceMin: 799,
    priceMax: 5999,
  },
  {
    id: 'speaker',
    label: 'Speaker/Mic',
    icon: Mic,
    priceMin: 299,
    priceMax: 1999,
  },
];

const TIME_SLOTS = [
  { value: '9-12', label: '9:00 AM - 12:00 PM' },
  { value: '12-3', label: '12:00 PM - 3:00 PM' },
  { value: '3-6', label: '3:00 PM - 6:00 PM' },
  { value: '6-9', label: '6:00 PM - 9:00 PM' },
];

const STEP_LABELS = ['Select Device', 'Repair Details', 'Pickup Details'];

// --- Helper ---

function getBrandIcon(brand: string) {
  const lower = brand.toLowerCase();
  if (['apple', 'samsung', 'oneplus', 'xiaomi', 'vivo', 'oppo', 'realme', 'google', 'nothing'].includes(lower))
    return Smartphone;
  if (['hp', 'lenovo', 'dell', 'asus'].includes(lower)) return Laptop;
  return Smartphone;
}

function formatPrice(n: number) {
  return n.toLocaleString('en-IN');
}

// --- Component ---

export default function BookPage() {
  
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // Step
  const [step, setStep] = useState(0);

  // Step 1 state
  const [selectedBrand, setSelectedBrand] = useState('');
  const [models, setModels] = useState<Device[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Device | null>(null);
  const [issue, setIssue] = useState('');

  // Step 2 state
  const [selectedRepairType, setSelectedRepairType] = useState('');

  // Step 3 state
  const [pickupType, setPickupType] = useState<'home' | 'store'>('home');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  // Submit state
  const [submitting, setSubmitting] = useState(false);

  // --- Auth guard ---
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // --- Fetch models when brand changes ---
  useEffect(() => {
    if (!selectedBrand) {
      setModels([]);
      setSelectedModel(null);
      return;
    }
    setModelsLoading(true);
    setSelectedModel(null);
    supabase
      .from('devices')
      .select('*')
      .eq('brand', selectedBrand)
      .then(({ data, error }) => {
        setModelsLoading(false);
        if (error) {
          toast.error('Failed to load device models');
          setModels([]);
        } else {
          setModels((data as Device[]) || []);
        }
      });
  }, [selectedBrand]);

  // --- Derived ---
  const selectedRepair = REPAIR_TYPES.find((r) => r.id === selectedRepairType);
  const estimatedCost = selectedRepair
    ? Math.round((selectedRepair.priceMin + selectedRepair.priceMax) / 2)
    : null;

  // Step 1 validation
  const step1Valid = selectedBrand && selectedModel && issue.trim().length > 0;
  // Step 2 validation
  const step2Valid = !!selectedRepairType;
  // Step 3 validation
  const step3Valid =
    pickupType === 'store' ||
    (pickupType === 'home' && address.trim().length > 0 && area && timeSlot);

  // --- Handlers ---
  const handleSubmit = async () => {
    if (!user || !selectedModel || !selectedRepair || !step3Valid) return;
    setSubmitting(true);

    try {
      const { data: repair, error: repairError } = await supabase
        .from('repairs')
        .insert({
          customer_id: user.id,
          device_id: selectedModel.id,
          issue_description: issue,
          status: 'booked',
          estimated_cost: estimatedCost,
          pickup_type: pickupType,
          address:
            pickupType === 'home'
              ? `${address}, ${area}, Nagpur`
              : 'CellCureHub Service Center, 42, Central Bazaar Road, Dharampeth, Nagpur 440010',
        })
        .select('id')
        .single();

      if (repairError) throw repairError;

      const { error: timelineError } = await supabase
        .from('repair_timeline')
        .insert({
          repair_id: repair.id,
          status: 'booked',
          note: 'Repair booking confirmed',
          updated_by: user.id,
        });

      if (timelineError) throw timelineError;

      toast.success('Booking confirmed! Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (err) {
      toast.error('Failed to create booking. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // --- Loading while auth resolves ---
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D084] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* --- Step Indicator --- */}
          <div className="flex items-center justify-center mb-10">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      backgroundColor:
                        i < step
                          ? '#00D084'
                          : i === step
                          ? '#00D084'
                          : 'rgba(255,255,255,0.1)',
                      scale: i === step ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold"
                  >
                    {i < step ? (
                      <Check className="w-5 h-5 text-[#0A0A0A]" />
                    ) : (
                      <span
                        className={
                          i === step ? 'text-[#0A0A0A]' : 'text-white/50'
                        }
                      >
                        {i + 1}
                      </span>
                    )}
                  </motion.div>
                  <span
                    className={`mt-2 text-xs font-medium ${
                      i <= step ? 'text-[#00D084]' : 'text-white/40'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div
                    className={`w-12 sm:w-20 h-0.5 mx-2 mb-6 transition-colors duration-300 ${
                      i < step ? 'bg-[#00D084]' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* --- Step Content --- */}
          <AnimatePresence mode="wait">
            {/* Step 1: Select Device */}
            {step === 0 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      Select Your Device
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {/* Brand selector */}
                    <div className="space-y-3">
                      <Label className="text-white/80 text-sm">Brand</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                        {BRANDS.map((brand) => {
                          const Icon = getBrandIcon(brand);
                          const active = selectedBrand === brand;
                          return (
                            <motion.button
                              key={brand}
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedBrand(brand)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                                active
                                  ? 'border-[#00D084] bg-[#00D084]/10 green-glow'
                                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                              }`}
                            >
                              <Icon
                                className={`w-6 h-6 ${
                                  active ? 'text-[#00D084]' : 'text-white/60'
                                }`}
                              />
                              <span
                                className={`text-xs font-medium ${
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

                    {/* Model selector */}
                    {selectedBrand && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        transition={{ duration: 0.3 }}
                        className="space-y-3"
                      >
                        <Label className="text-white/80 text-sm">Model</Label>
                        {modelsLoading ? (
                          <div className="flex items-center gap-2 text-white/50 text-sm py-4">
                            <div className="w-4 h-4 border-2 border-[#00D084] border-t-transparent rounded-full animate-spin" />
                            Loading models...
                          </div>
                        ) : models.length === 0 ? (
                          <p className="text-white/40 text-sm py-2">
                            No models found for {selectedBrand}.
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {models.map((model) => {
                              const active = selectedModel?.id === model.id;
                              return (
                                <motion.button
                                  key={model.id}
                                  whileHover={{ scale: 1.03 }}
                                  whileTap={{ scale: 0.97 }}
                                  onClick={() => setSelectedModel(model)}
                                  className={`p-3 rounded-xl border text-left transition-all duration-200 ${
                                    active
                                      ? 'border-[#00D084] bg-[#00D084]/10 green-glow'
                                      : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                                  }`}
                                >
                                  <span
                                    className={`text-sm font-medium ${
                                      active
                                        ? 'text-[#00D084]'
                                        : 'text-white/70'
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
                        )}
                      </motion.div>
                    )}

                    {/* Issue description */}
                    <div className="space-y-2">
                      <Label htmlFor="issue" className="text-white/80 text-sm">
                        Describe the Issue
                      </Label>
                      <Textarea
                        id="issue"
                        placeholder="E.g. Screen cracked after drop, phone not charging..."
                        value={issue}
                        onChange={(e) => setIssue(e.target.value)}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[100px]"
                      />
                    </div>

                    {/* Next */}
                    <div className="flex justify-end">
                      <Button
                        disabled={!step1Valid}
                        onClick={() => setStep(1)}
                        className="bg-[#00D084] hover:bg-[#00D084]/90 text-[#0A0A0A] font-semibold"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Repair Details */}
            {step === 1 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">
                      Repair Details
                    </CardTitle>
                    <p className="text-sm text-white/50 mt-1">
                      {selectedModel?.brand} {selectedModel?.model_name}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-white/80 text-sm">
                        Select Repair Type
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {REPAIR_TYPES.map((repair) => {
                          const Icon = repair.icon;
                          const active = selectedRepairType === repair.id;
                          return (
                            <motion.button
                              key={repair.id}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => setSelectedRepairType(repair.id)}
                              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-center ${
                                active
                                  ? 'border-[#00D084] bg-[#00D084]/10 green-glow'
                                  : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/[0.07]'
                              }`}
                            >
                              <Icon
                                className={`w-6 h-6 ${
                                  active ? 'text-[#00D084]' : 'text-white/60'
                                }`}
                              />
                              <span
                                className={`text-xs font-medium leading-tight ${
                                  active ? 'text-[#00D084]' : 'text-white/60'
                                }`}
                              >
                                {repair.label}
                              </span>
                              <span className="text-[10px] text-white/40 mt-1">
                                &#8377;{formatPrice(repair.priceMin)} - &#8377;
                                {formatPrice(repair.priceMax)}
                              </span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Estimated cost display */}
                    {selectedRepair && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-[#00D084]/10 border border-[#00D084]/20"
                      >
                        <span className="text-sm text-white/70">
                          Estimated Cost:
                        </span>
                        <span className="text-lg font-semibold text-[#00D084]">
                          &#8377;{formatPrice(selectedRepair.priceMin)} - &#8377;
                          {formatPrice(selectedRepair.priceMax)}
                        </span>
                      </motion.div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setStep(0)}
                        className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                      </Button>
                      <Button
                        disabled={!step2Valid}
                        onClick={() => setStep(2)}
                        className="bg-[#00D084] hover:bg-[#00D084]/90 text-[#0A0A0A] font-semibold"
                      >
                        Next
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Pickup Details */}
            {step === 2 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Left: Form */}
                  <div className="flex-1">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                      <CardHeader>
                        <CardTitle className="text-xl text-white">
                          Pickup Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Pickup type toggle */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">
                            Pickup Type
                          </Label>
                          <div className="flex rounded-xl bg-white/5 p-1">
                            <button
                              type="button"
                              onClick={() => setPickupType('home')}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                                pickupType === 'home'
                                  ? 'bg-[#00D084] text-[#0A0A0A]'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              <Truck className="w-4 h-4" />
                              Home Pickup
                            </button>
                            <button
                              type="button"
                              onClick={() => setPickupType('store')}
                              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all ${
                                pickupType === 'store'
                                  ? 'bg-[#00D084] text-[#0A0A0A]'
                                  : 'text-white/60 hover:text-white'
                              }`}
                            >
                              <Store className="w-4 h-4" />
                              Store Drop-off
                            </button>
                          </div>
                        </div>

                        {/* Home pickup form */}
                        {pickupType === 'home' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-4"
                          >
                            <div className="space-y-2">
                              <Label
                                htmlFor="address"
                                className="text-white/80 text-sm"
                              >
                                Full Address
                              </Label>
                              <Textarea
                                id="address"
                                placeholder="House/Flat No, Building, Street..."
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[80px]"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white/80 text-sm">Area</Label>
                              <Select value={area} onValueChange={setArea}>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white focus:ring-[#00D084]">
                                  <SelectValue placeholder="Select area" />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1A1A1A] border-white/10">
                                  {NAGPUR_AREAS.map((a) => (
                                    <SelectItem
                                      key={a}
                                      value={a}
                                      className="text-white/80 focus:bg-[#00D084]/10 focus:text-[#00D084]"
                                    >
                                      {a}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white/80 text-sm">
                                Preferred Time Slot
                              </Label>
                              <div className="grid grid-cols-2 gap-3">
                                {TIME_SLOTS.map((slot) => {
                                  const active = timeSlot === slot.value;
                                  return (
                                    <motion.button
                                      key={slot.value}
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => setTimeSlot(slot.value)}
                                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm transition-all duration-200 ${
                                        active
                                          ? 'border-[#00D084] bg-[#00D084]/10 text-[#00D084]'
                                          : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'
                                      }`}
                                    >
                                      <Clock className="w-4 h-4" />
                                      {slot.label}
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Store drop-off info */}
                        {pickupType === 'store' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                              <MapPin className="w-5 h-5 text-[#00D084] mt-0.5 shrink-0" />
                              <div>
                                <p className="text-white font-medium text-sm">
                                  CellCureHub Service Center
                                </p>
                                <p className="text-white/50 text-sm mt-1">
                                  42, Central Bazaar Road, Dharampeth,
                                  <br />
                                  Nagpur 440010
                                </p>
                                <p className="text-white/40 text-xs mt-2">
                                  Open Mon-Sat, 9:00 AM - 9:00 PM
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between pt-2">
                          <Button
                            variant="outline"
                            onClick={() => setStep(1)}
                            className="border-white/10 bg-white/5 hover:bg-white/10 text-white"
                          >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back
                          </Button>
                          <Button
                            disabled={!step3Valid || submitting}
                            onClick={handleSubmit}
                            className="gradient-green text-[#0A0A0A] font-semibold px-6"
                          >
                            {submitting ? (
                              <span className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                                Confirming...
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Check className="w-4 h-4" />
                                Confirm Booking
                              </span>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Right: Summary card */}
                  <div className="lg:w-80 shrink-0">
                    <Card className="border-white/10 bg-white/5 backdrop-blur-xl sticky top-24">
                      <CardHeader>
                        <CardTitle className="text-lg text-white">
                          Booking Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Device */}
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                            Device
                          </p>
                          <p className="text-sm text-white font-medium">
                            {selectedModel?.brand} {selectedModel?.model_name}
                          </p>
                        </div>

                        {/* Issue */}
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                            Issue
                          </p>
                          <p className="text-sm text-white/70 line-clamp-3">
                            {issue}
                          </p>
                        </div>

                        {/* Repair type */}
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                            Repair Type
                          </p>
                          <p className="text-sm text-white font-medium">
                            {selectedRepair?.label}
                          </p>
                          {selectedRepair && (
                            <p className="text-sm text-[#00D084] font-semibold mt-0.5">
                              &#8377;{formatPrice(selectedRepair.priceMin)} - &#8377;
                              {formatPrice(selectedRepair.priceMax)}
                            </p>
                          )}
                        </div>

                        {/* Pickup */}
                        <div>
                          <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                            Pickup
                          </p>
                          <p className="text-sm text-white font-medium">
                            {pickupType === 'home'
                              ? 'Home Pickup'
                              : 'Store Drop-off'}
                          </p>
                          {pickupType === 'home' && address && (
                            <p className="text-xs text-white/50 mt-0.5 line-clamp-2">
                              {address}
                              {area ? `, ${area}` : ''}
                            </p>
                          )}
                          {pickupType === 'home' && timeSlot && (
                            <p className="text-xs text-white/50 mt-0.5">
                              {TIME_SLOTS.find((s) => s.value === timeSlot)
                                ?.label}
                            </p>
                          )}
                          {pickupType === 'store' && (
                            <p className="text-xs text-white/50 mt-0.5">
                              42, Central Bazaar Road, Dharampeth, Nagpur
                              440010
                            </p>
                          )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-white/10" />

                        {/* Estimated total */}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/60">
                            Est. Cost
                          </span>
                          <span className="text-lg font-bold text-[#00D084]">
                            {estimatedCost
                              ? `~\u20B9${formatPrice(estimatedCost)}`
                              : '--'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
}
