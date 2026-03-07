import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Truck, Zap, ArrowRight, Package, Loader2, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lbToKg, kgToLb, inToCm } from '@/lib/mockData';
import { apiRequest } from '@/lib/queryClient';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface RateParams {
  product_code: string;
  destination_code: string;
  booking_date: string;
  origin_code: string;
  pcs: string;
  actual_weight: string;
}

interface ITDRateResponse {
  success?: boolean;
  data?: {
    total_amount?: string | number;
    base_rate?: string | number;
    fuel_surcharge?: string | number;
    handling_charges?: string | number;
    tax?: string | number;
  };
  total_amount?: string | number;
  base_rate?: string | number;
}

interface RateResult {
  total: number;
  base: number;
  fuel: number;
  handling: number;
  tax: number;
  weightLb: number;
  weightKg: number;
  dimLIn?: number;
  dimWIn?: number;
  dimHIn?: number;
  pieces: number;
  productType: string;
  etaDate: Date;
}

function parseAmount(val: string | number | undefined): number {
  if (val === undefined || val === null) return 0;
  return parseFloat(String(val).replace(/[^0-9.]/g, '')) || 0;
}

function extractRateResult(raw: ITDRateResponse, weightLb: number, weightKg: number, pieces: number, productType: string, dimLIn?: number, dimWIn?: number, dimHIn?: number): RateResult {
  const data = raw.data ?? raw;
  const total = parseAmount((data as ITDRateResponse).total_amount ?? (raw as ITDRateResponse).total_amount);
  const base = parseAmount((data as ITDRateResponse).base_rate ?? (raw as ITDRateResponse).base_rate);
  const fuel = parseAmount((data as { fuel_surcharge?: string | number }).fuel_surcharge);
  const handling = parseAmount((data as { handling_charges?: string | number }).handling_charges);
  const tax = parseAmount((data as { tax?: string | number }).tax);

  // If we got a total but no breakdown, estimate proportions
  const effectiveTotal = total || (base + fuel + handling + tax);
  const effectiveBase = base || Math.floor(effectiveTotal * 0.7);
  const effectiveFuel = fuel || Math.floor(effectiveTotal * 0.15);
  const effectiveHandling = handling || Math.floor(effectiveTotal * 0.1);
  const effectiveTax = tax || Math.floor(effectiveTotal * 0.05);

  return {
    total: effectiveTotal || effectiveBase + effectiveFuel + effectiveHandling + effectiveTax,
    base: effectiveBase,
    fuel: effectiveFuel,
    handling: effectiveHandling,
    tax: effectiveTax,
    weightLb,
    weightKg,
    dimLIn,
    dimWIn,
    dimHIn,
    pieces,
    productType,
    etaDate: addDays(new Date(), 7),
  };
}

export default function Rates() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [expandedRate, setExpandedRate] = useState<string | null>(null);

  const [productType, setProductType] = useState<'Document' | 'Package'>('Package');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [dimUnit, setDimUnit] = useState<'in' | 'cm'>('in');
  const [weight, setWeight] = useState('2');
  const [pieces, setPieces] = useState('1');
  const [dimL, setDimL] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [originZip, setOriginZip] = useState('');
  const [destPincode, setDestPincode] = useState('');

  const [rateResult, setRateResult] = useState<RateResult | null>(null);
  const [apiError, setApiError] = useState('');

  const rateMutation = useMutation({
    mutationFn: (params: RateParams) =>
      apiRequest('POST', '/api/rates', params).then((r) => r.json() as Promise<ITDRateResponse>),
    onSuccess: (data) => {
      const w = parseFloat(weight) || 1;
      const weightLb = weightUnit === 'lb' ? w : kgToLb(w);
      const weightKg = weightUnit === 'kg' ? w : lbToKg(w);

      let dimLIn: number | undefined;
      let dimWIn: number | undefined;
      let dimHIn: number | undefined;
      if (dimL || dimW || dimH) {
        if (dimUnit === 'in') {
          dimLIn = parseFloat(dimL) || undefined;
          dimWIn = parseFloat(dimW) || undefined;
          dimHIn = parseFloat(dimH) || undefined;
        } else {
          dimLIn = dimL ? parseFloat(dimL) / 2.54 : undefined;
          dimWIn = dimW ? parseFloat(dimW) / 2.54 : undefined;
          dimHIn = dimH ? parseFloat(dimH) / 2.54 : undefined;
        }
      }

      setRateResult(extractRateResult(
        data,
        parseFloat(weightLb.toFixed(1)),
        parseFloat(weightKg.toFixed(2)),
        parseInt(pieces) || 1,
        productType,
        dimLIn, dimWIn, dimHIn,
      ));
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message.replace(/^\d+:\s*/, '') : 'Rate calculation failed';
      setApiError(msg);
    },
  });

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleGetRates = () => {
    setApiError('');
    const w = parseFloat(weight) || 1;
    const weightLb = weightUnit === 'lb' ? w : kgToLb(w);

    rateMutation.mutate({
      product_code: productType === 'Document' ? 'DOC' : 'PKG',
      destination_code: 'IN',
      booking_date: new Date().toISOString().split('T')[0],
      origin_code: 'US',
      pcs: String(parseInt(pieces) || 1),
      actual_weight: String(weightLb.toFixed(2)),
    });
  };

  const handleBack = () => {
    if (rateResult) {
      setRateResult(null);
    } else if (step === 2) {
      setStep(1);
    } else {
      setLocation('/home');
    }
  };

  if (rateResult) {
    return (
      <div className="min-h-screen bg-background pb-20" data-testid="screen-rates-results">
        <header className="sticky top-0 z-50 bg-white border-b-2 border-primary/20 safe-top">
          <div className="flex items-center h-14 px-4 max-w-md mx-auto">
            <button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
              data-testid="button-back-rates"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-2 font-semibold text-sm">Rate Options</h1>
          </div>
        </header>

        <main className="px-4 py-5 max-w-md mx-auto">
          <div className="bg-card rounded-xl border border-border p-4 mb-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">{rateResult.productType} · {rateResult.pieces} pc</p>
                <p className="text-xs text-muted-foreground">USA → India</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Weight</p>
                <p className="font-semibold">{rateResult.weightLb} lb</p>
                <p className="text-[10px] text-muted-foreground">{rateResult.weightKg} kg</p>
              </div>
              {rateResult.dimLIn && rateResult.dimWIn && rateResult.dimHIn && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Dimensions</p>
                  <p className="font-semibold">{rateResult.dimLIn.toFixed(0)}×{rateResult.dimWIn.toFixed(0)}×{rateResult.dimHIn.toFixed(0)} in</p>
                  <p className="text-[10px] text-muted-foreground">
                    {inToCm(rateResult.dimLIn).toFixed(0)}×{inToCm(rateResult.dimWIn).toFixed(0)}×{inToCm(rateResult.dimHIn).toFixed(0)} cm
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div
              className={cn(
                'bg-card rounded-xl border transition-all shadow-sm',
                expandedRate === 'rate' ? 'border-primary' : 'border-border'
              )}
            >
              <button
                onClick={() => setExpandedRate(expandedRate === 'rate' ? null : 'rate')}
                className="w-full p-4 text-left"
                data-testid="rate-card-express"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Express</h3>
                      <p className="text-xs text-muted-foreground">
                        By {format(rateResult.etaDate, 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">
                      {rateResult.total > 0 ? `$${rateResult.total}` : 'Contact us'}
                    </span>
                    {expandedRate === 'rate' ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {expandedRate === 'rate' && rateResult.total > 0 && (
                <div className="px-4 pb-4 border-t border-border pt-3 animate-slide-up">
                  <p className="font-medium text-xs mb-2 text-muted-foreground">Cost Breakdown</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Rate</span>
                      <span>${rateResult.base}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Surcharge</span>
                      <span>${rateResult.fuel}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Handling</span>
                      <span>${rateResult.handling}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${rateResult.tax}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-border">
                      <span>Total</span>
                      <span>${rateResult.total}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                  <Truck className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">Standard</h3>
                  <p className="text-xs text-muted-foreground">Contact us for standard rates</p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground text-center mt-5">
            Estimated only. Final charges may vary.
          </p>
        </main>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28" data-testid="screen-rates">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="px-4 py-5 max-w-md mx-auto">
        <h1 className="text-lg font-semibold text-foreground mb-1">Get Rates</h1>
        <p className="text-sm text-muted-foreground mb-5">USA → India shipping</p>

        <div className="flex items-center gap-2 mb-5">
          <div className={cn(
            'flex-1 h-1.5 rounded-full transition-colors',
            'bg-primary'
          )} />
          <div className={cn(
            'flex-1 h-1.5 rounded-full transition-colors',
            step === 2 ? 'bg-primary' : 'bg-muted'
          )} />
        </div>

        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <Label className="text-sm font-semibold mb-3 block">What are you shipping?</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['Document', 'Package'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductType(type)}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all text-sm font-medium',
                      productType === type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-muted-foreground/30'
                    )}
                    data-testid={`button-type-${type.toLowerCase()}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Weight</Label>
                <div className="flex bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => setWeightUnit('lb')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      weightUnit === 'lb' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    lb
                  </button>
                  <button
                    onClick={() => setWeightUnit('kg')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      weightUnit === 'kg' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    kg
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Weight ({weightUnit})</Label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="2"
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    step="0.1"
                    min="0.1"
                    data-testid="input-weight"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">Pieces</Label>
                  <Input
                    type="number"
                    value={pieces}
                    onChange={(e) => setPieces(e.target.value)}
                    placeholder="1"
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    min="1"
                    data-testid="input-pieces"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-semibold">Dimensions <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <div className="flex bg-muted rounded-lg p-0.5">
                  <button
                    onClick={() => setDimUnit('in')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      dimUnit === 'in' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    in
                  </button>
                  <button
                    onClick={() => setDimUnit('cm')}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                      dimUnit === 'cm' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'
                    )}
                  >
                    cm
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-[10px] text-muted-foreground">L ({dimUnit})</Label>
                  <Input
                    type="number"
                    value={dimL}
                    onChange={(e) => setDimL(e.target.value)}
                    placeholder="12"
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-dim-l"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">W ({dimUnit})</Label>
                  <Input
                    type="number"
                    value={dimW}
                    onChange={(e) => setDimW(e.target.value)}
                    placeholder="10"
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-dim-w"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-muted-foreground">H ({dimUnit})</Label>
                  <Input
                    type="number"
                    value={dimH}
                    onChange={(e) => setDimH(e.target.value)}
                    placeholder="8"
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-dim-h"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <Label className="text-sm font-semibold mb-3 block">From (USA)</Label>
              <Input
                value={originZip}
                onChange={(e) => setOriginZip(e.target.value)}
                placeholder="ZIP Code (e.g., 10001)"
                className="h-11 text-sm bg-muted/30 border-border rounded-xl"
                data-testid="input-origin-zip"
              />
            </div>

            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <Label className="text-sm font-semibold mb-3 block">To (India)</Label>
              <Input
                value={destPincode}
                onChange={(e) => setDestPincode(e.target.value)}
                placeholder="Pincode (e.g., 400001)"
                className="h-11 text-sm bg-muted/30 border-border rounded-xl"
                data-testid="input-dest-pincode"
              />
            </div>

            {apiError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{apiError}</p>
              </div>
            )}
          </div>
        )}
      </main>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border p-4 safe-bottom">
        <div className="max-w-md mx-auto flex gap-2">
          {step === 2 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="h-12 px-6 rounded-xl border-border"
            >
              Back
            </Button>
          )}
          <Button
            onClick={step === 1 ? handleNext : handleGetRates}
            disabled={rateMutation.isPending}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-sm font-semibold rounded-xl shadow-md disabled:opacity-70"
            data-testid="button-next-rates"
          >
            {rateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {step === 2 ? 'Get Rates' : 'Continue'}
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
