'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { ChevronLeft, ChevronRight, Check, MapPin, Clock, Store, Truck, Wrench, Battery, Monitor, Droplets, HardDrive, Settings, CalendarDays, Navigation } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { NAGPUR_AREAS, REPAIR_TYPE_OPTIONS } from '@/lib/types';
import type { Device, Pricing } from '@/lib/types';
import { Navbar } from '@/components/navbar';
import { Footer } from '@/components/footer';
import DeviceSelector from '@/components/device-selector';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const STEP_LABELS = ['Select Device', 'Repair Details', 'Pickup & Schedule'];

const REPAIR_TYPE_ICONS: Record<string, React.ElementType> = {
  screen_replacement: Monitor, battery_replacement: Battery, charging_port: Wrench,
  water_damage: Droplets, software_issue: HardDrive, custom: Settings,
};

const TIME_SLOTS = [
  { value: 'morning' as const, label: 'Morning 9–12' },
  { value: 'afternoon' as const, label: 'Afternoon 12–4' },
  { value: 'evening' as const, label: 'Evening 4–7' },
];

export default function BookPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(0);

  // Step 1
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [manualModel, setManualModel] = useState('');

  // Step 2
  const [repairType, setRepairType] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [issueNotes, setIssueNotes] = useState('');
  const [imei, setImei] = useState('');
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  // Step 3
  const [pickupType, setPickupType] = useState<'home' | 'store'>('home');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [preferredDate, setPreferredDate] = useState<Date | undefined>(undefined);
  const [timeSlot, setTimeSlot] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  // Pre-fill address from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('cellcurehub_default_address');
    if (saved) setAddress(saved);
  }, []);

  // Fetch pricing when device + repair type selected
  useEffect(() => {
    if (!selectedDevice || !repairType || repairType === 'custom') {
      setPricing(null);
      return;
    }
    setPricingLoading(true);
    supabase
      .from('pricing')
      .select('*')
      .eq('device_id', selectedDevice.id)
      .eq('repair_type', repairType)
      .maybeSingle()
      .then(({ data }) => {
        setPricing(data as Pricing | null);
        setPricingLoading(false);
      });
  }, [selectedDevice, repairType]);

  const handleDeviceSelect = (device: Device | null, manual?: string) => {
    setSelectedDevice(device);
    setManualModel(manual || '');
  };

  // Validations
  const step1Valid = selectedDevice !== null || manualModel.trim().length > 0;
  const step2Valid = repairType && imei.match(/^\d{15}$/) && (repairType !== 'custom' || customDescription.trim().length > 0);
  const step3Valid = pickupType === 'store' || (address.trim().length > 0 && area && timeSlot && preferredDate);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoordinates({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setAddress(`Location captured (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        setGeoLoading(false);
        toast.success('Location captured!');
      },
      () => {
        toast.error('Unable to get your location');
        setGeoLoading(false);
      }
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const repairData: Record<string, unknown> = {
        customer_id: user.id,
        device_id: selectedDevice?.id || null,
        manual_model: manualModel || null,
        imei_number: imei,
        repair_type: repairType,
        custom_repair_description: repairType === 'custom' ? customDescription : null,
        issue_description: issueNotes || `${REPAIR_TYPE_OPTIONS.find(r => r.value === repairType)?.label || repairType} repair`,
        status: 'booked',
        pickup_type: pickupType,
        address: pickupType === 'home' ? `${address}, ${area}, Nagpur` : 'CellCureHub Service Center, Dharampeth, Nagpur 440010',
        coordinates: coordinates ? `(${coordinates.lng},${coordinates.lat})` : null,
        preferred_date: preferredDate ? preferredDate.toISOString().split('T')[0] : null,
        time_slot: pickupType === 'home' ? timeSlot : null,
        estimated_cost: pricing?.min_price || null,
      };

      const { data: repair, error: repairError } = await supabase
        .from('repairs')
        .insert(repairData)
        .select('id')
        .single();

      if (repairError) throw repairError;

      await supabase.from('repair_timeline').insert({
        repair_id: repair.id,
        status: 'booked',
        note: 'Repair request confirmed',
        updated_by: user.id,
      });

      toast.success('Booking confirmed! Redirecting to dashboard...');
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create booking. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#00D084] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col">
      <Navbar />
      <main className="flex-1 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Step Indicator */}
          <div className="flex items-center justify-center mb-10">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <motion.div initial={false} animate={{ backgroundColor: i <= step ? '#00D084' : 'rgba(255,255,255,0.1)', scale: i === step ? 1.1 : 1 }} transition={{ duration: 0.3 }} className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold">
                    {i < step ? <Check className="w-5 h-5 text-[#0A0A0A]" /> : <span className={i === step ? 'text-[#0A0A0A]' : 'text-white/50'}>{i + 1}</span>}
                  </motion.div>
                  <span className={`mt-2 text-xs font-medium ${i <= step ? 'text-[#00D084]' : 'text-white/40'}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && <div className={`w-12 sm:w-20 h-0.5 mx-2 mb-6 transition-colors duration-300 ${i < step ? 'bg-[#00D084]' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 0 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-xl text-white">Select Your Device</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    <DeviceSelector onSelect={handleDeviceSelect} showManualOption selectedDevice={selectedDevice} selectedManualModel={manualModel} />
                    <div className="flex justify-end">
                      <Button disabled={!step1Valid} onClick={() => setStep(1)} className="bg-[#00D084] hover:bg-[#00D084]/90 text-[#0A0A0A] font-semibold">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 1 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">Repair Details</CardTitle>
                    <p className="text-sm text-white/50 mt-1">{selectedDevice ? `${selectedDevice.brand} ${selectedDevice.model_name}` : manualModel}</p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Repair Type */}
                    <div className="space-y-3">
                      <Label className="text-white/80 text-sm">Repair Type</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {REPAIR_TYPE_OPTIONS.map((rt) => {
                          const Icon = REPAIR_TYPE_ICONS[rt.value] || Wrench;
                          const active = repairType === rt.value;
                          return (
                            <motion.button key={rt.value} type="button" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setRepairType(rt.value)} className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-center ${active ? 'border-[#00D084] bg-[#00D084]/10 green-glow' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                              <Icon className={`w-6 h-6 ${active ? 'text-[#00D084]' : 'text-white/60'}`} />
                              <span className={`text-xs font-medium ${active ? 'text-[#00D084]' : 'text-white/60'}`}>{rt.label}</span>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom description */}
                    {repairType === 'custom' && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                        <Label className="text-white/80 text-sm">Describe the Issue *</Label>
                        <Textarea value={customDescription} onChange={(e) => setCustomDescription(e.target.value)} placeholder="Describe what's wrong..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[80px]" />
                      </motion.div>
                    )}

                    {/* Notes for standard types */}
                    {repairType && repairType !== 'custom' && (
                      <div className="space-y-2">
                        <Label className="text-white/80 text-sm">Additional Notes (optional)</Label>
                        <Textarea value={issueNotes} onChange={(e) => setIssueNotes(e.target.value)} placeholder="Any extra details..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[60px]" />
                      </div>
                    )}

                    {/* Pricing display */}
                    {repairType && repairType !== 'custom' && (
                      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#00D084]/10 border border-[#00D084]/20">
                        <span className="text-sm text-white/70">Estimated Cost:</span>
                        {pricingLoading ? (
                          <span className="text-sm text-white/50">Loading...</span>
                        ) : pricing ? (
                          <span className="text-lg font-semibold text-[#00D084]">₹{pricing.min_price.toLocaleString('en-IN')} – ₹{pricing.max_price.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-sm text-amber-400">Contact us for pricing</span>
                        )}
                      </div>
                    )}

                    {/* IMEI */}
                    <div className="space-y-2">
                      <Label className="text-white/80 text-sm">IMEI Number *</Label>
                      <Input type="text" maxLength={15} value={imei} onChange={(e) => setImei(e.target.value.replace(/\D/g, ''))} placeholder="15-digit IMEI number" className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] font-mono" />
                      <p className="text-xs text-white/30">Dial *#06# on your phone to find IMEI</p>
                      {imei.length > 0 && imei.length !== 15 && <p className="text-xs text-red-400">IMEI must be exactly 15 digits</p>}
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(0)} className="border-white/10 bg-white/5 hover:bg-white/10 text-white"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                      <Button disabled={!step2Valid} onClick={() => setStep(2)} className="bg-[#00D084] hover:bg-[#00D084]/90 text-[#0A0A0A] font-semibold">Next <ChevronRight className="w-4 h-4 ml-1" /></Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 2 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <Card className="border-white/10 bg-white/5 backdrop-blur-xl">
                  <CardHeader><CardTitle className="text-xl text-white">Pickup & Schedule</CardTitle></CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pickup type */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { type: 'home' as const, icon: Truck, label: '🏠 Home Pickup', desc: 'We come to you' },
                        { type: 'store' as const, icon: Store, label: '🏪 Drop at Store', desc: 'Visit our center' },
                      ].map((opt) => (
                        <motion.button key={opt.type} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setPickupType(opt.type)} className={`p-4 rounded-xl border text-center transition-all ${pickupType === opt.type ? 'border-[#00D084] bg-[#00D084]/10 green-glow' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                          <p className={`text-lg mb-1 ${pickupType === opt.type ? 'text-[#00D084]' : 'text-white/70'}`}>{opt.label}</p>
                          <p className="text-xs text-white/40">{opt.desc}</p>
                        </motion.button>
                      ))}
                    </div>

                    {pickupType === 'home' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                        {/* Address */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Pickup Address</Label>
                          <Textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House/Flat No, Street, Landmark..." className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-[#00D084] min-h-[70px]" />
                          <Button type="button" variant="outline" size="sm" onClick={handleGeolocation} disabled={geoLoading} className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 text-xs">
                            <Navigation className="w-3 h-3 mr-1" /> {geoLoading ? 'Capturing...' : '📍 Use Current Location'}
                          </Button>
                        </div>

                        {/* Area */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Area</Label>
                          <Select value={area} onValueChange={setArea}>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select area" /></SelectTrigger>
                            <SelectContent className="bg-[#1A1A1A] border-white/10">
                              {NAGPUR_AREAS.map((a) => <SelectItem key={a} value={a} className="text-white/80 focus:bg-[#00D084]/10 focus:text-[#00D084]">{a}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Preferred Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start border-white/10 bg-white/5 text-white hover:bg-white/10">
                                <CalendarDays className="w-4 h-4 mr-2 text-white/40" />
                                {preferredDate ? preferredDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pick a date'}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 bg-[#1A1A1A] border-white/10" align="start">
                              <Calendar mode="single" selected={preferredDate} onSelect={setPreferredDate} disabled={(date) => date < tomorrow} className="bg-[#1A1A1A] text-white" />
                            </PopoverContent>
                          </Popover>
                        </div>

                        {/* Time Slot */}
                        <div className="space-y-2">
                          <Label className="text-white/80 text-sm">Time Slot</Label>
                          <div className="grid grid-cols-3 gap-3">
                            {TIME_SLOTS.map((slot) => (
                              <motion.button key={slot.value} type="button" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setTimeSlot(slot.value)} className={`flex items-center justify-center gap-1 p-3 rounded-xl border text-sm transition-all ${timeSlot === slot.value ? 'border-[#00D084] bg-[#00D084]/10 text-[#00D084]' : 'border-white/10 bg-white/5 text-white/60 hover:border-white/20'}`}>
                                <Clock className="w-3.5 h-3.5" /> {slot.label}
                              </motion.button>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {pickupType === 'store' && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                          <MapPin className="w-5 h-5 text-[#00D084] mt-0.5 shrink-0" />
                          <div>
                            <p className="text-white font-medium text-sm">CellCureHub Service Center</p>
                            <p className="text-white/50 text-sm mt-1">42, Central Bazaar Road, Dharampeth,<br />Nagpur 440010</p>
                            <p className="text-white/40 text-xs mt-2">Open Mon–Sat, 9:00 AM – 9:00 PM</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="flex justify-between pt-2">
                      <Button variant="outline" onClick={() => setStep(1)} className="border-white/10 bg-white/5 hover:bg-white/10 text-white"><ChevronLeft className="w-4 h-4 mr-1" /> Back</Button>
                      <Button disabled={!step3Valid || submitting} onClick={handleSubmit} className="gradient-green text-[#0A0A0A] font-semibold px-6">
                        {submitting ? (<span className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />Confirming...</span>) : (<span className="flex items-center gap-2"><Check className="w-4 h-4" /> Confirm Booking</span>)}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </div>
  );
}
