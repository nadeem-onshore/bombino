import { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Truck, Zap, ArrowRight, Package } from 'lucide-react';
import { useLocation } from 'wouter';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { calculateRateFromLb, calculateRateFromKg, lbToKg, kgToLb, inToCm } from '@/lib/mockData';
import { format, addDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface RateResult {
  standard: number;
  express: number;
  standardETA: Date;
  expressETA: Date;
  weightLb: number;
  weightKg: number;
  dimLIn?: number;
  dimWIn?: number;
  dimHIn?: number;
  pieces: number;
  productType: string;
}

export default function Rates() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<1 | 2 | 'results'>(1);
  const [rates, setRates] = useState<RateResult | null>(null);
  const [expandedRate, setExpandedRate] = useState<'standard' | 'express' | null>(null);

  const [productType, setProductType] = useState<'Document' | 'Package'>('Package');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [dimUnit, setDimUnit] = useState<'in' | 'cm'>('in');
  const [weight, setWeight] = useState('2');
  const [pieces, setPieces] = useState('1');
  const [dimL, setDimL] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');
  const [declaredValue, setDeclaredValue] = useState('');
  const [originZip, setOriginZip] = useState('');
  const [destPincode, setDestPincode] = useState('');

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      const w = parseFloat(weight) || 1;
      const today = new Date();
      
      let weightLb: number;
      let weightKg: number;
      
      if (weightUnit === 'lb') {
        weightLb = w;
        weightKg = lbToKg(w);
      } else {
        weightKg = w;
        weightLb = kgToLb(w);
      }

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
      
      setRates({
        standard: calculateRateFromLb(weightLb, 'Standard'),
        express: calculateRateFromLb(weightLb, 'Express'),
        standardETA: addDays(today, 8),
        expressETA: addDays(today, 5),
        weightLb: parseFloat(weightLb.toFixed(1)),
        weightKg: parseFloat(weightKg.toFixed(2)),
        dimLIn,
        dimWIn,
        dimHIn,
        pieces: parseInt(pieces) || 1,
        productType,
      });
      setStep('results');
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 'results') {
      setStep(2);
    } else {
      setLocation('/home');
    }
  };

  if (step === 'results' && rates) {
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
                <p className="font-semibold text-sm">{rates.productType} · {rates.pieces} pc</p>
                <p className="text-xs text-muted-foreground">USA → India</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Weight</p>
                <p className="font-semibold">{rates.weightLb} lb</p>
                <p className="text-[10px] text-muted-foreground">{rates.weightKg} kg</p>
              </div>
              {rates.dimLIn && rates.dimWIn && rates.dimHIn && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Dimensions</p>
                  <p className="font-semibold">{rates.dimLIn.toFixed(0)}×{rates.dimWIn.toFixed(0)}×{rates.dimHIn.toFixed(0)} in</p>
                  <p className="text-[10px] text-muted-foreground">
                    {inToCm(rates.dimLIn).toFixed(0)}×{inToCm(rates.dimWIn).toFixed(0)}×{inToCm(rates.dimHIn).toFixed(0)} cm
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div 
              className={cn(
                "bg-card rounded-xl border transition-all shadow-sm",
                expandedRate === 'express' ? 'border-primary' : 'border-border'
              )}
            >
              <button
                onClick={() => setExpandedRate(expandedRate === 'express' ? null : 'express')}
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
                        By {format(rates.expressETA, 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">${rates.express}</span>
                    {expandedRate === 'express' ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {expandedRate === 'express' && (
                <div className="px-4 pb-4 border-t border-border pt-3 animate-slide-up">
                  <p className="font-medium text-xs mb-2 text-muted-foreground">Cost Breakdown</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Rate</span>
                      <span>${Math.floor(rates.express * 0.7)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Surcharge</span>
                      <span>${Math.floor(rates.express * 0.15)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Handling</span>
                      <span>${Math.floor(rates.express * 0.1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${Math.floor(rates.express * 0.05)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-border">
                      <span>Total</span>
                      <span>${rates.express}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div 
              className={cn(
                "bg-card rounded-xl border transition-all shadow-sm",
                expandedRate === 'standard' ? 'border-primary' : 'border-border'
              )}
            >
              <button
                onClick={() => setExpandedRate(expandedRate === 'standard' ? null : 'standard')}
                className="w-full p-4 text-left"
                data-testid="rate-card-standard"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <Truck className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Standard</h3>
                      <p className="text-xs text-muted-foreground">
                        By {format(rates.standardETA, 'MMM d')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-emerald-600">${rates.standard}</span>
                    {expandedRate === 'standard' ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </button>

              {expandedRate === 'standard' && (
                <div className="px-4 pb-4 border-t border-border pt-3 animate-slide-up">
                  <p className="font-medium text-xs mb-2 text-muted-foreground">Cost Breakdown</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Base Rate</span>
                      <span>${Math.floor(rates.standard * 0.7)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Surcharge</span>
                      <span>${Math.floor(rates.standard * 0.15)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Handling</span>
                      <span>${Math.floor(rates.standard * 0.1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>${Math.floor(rates.standard * 0.05)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-2 border-t border-border">
                      <span>Total</span>
                      <span>${rates.standard}</span>
                    </div>
                  </div>
                </div>
              )}
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
            "flex-1 h-1.5 rounded-full transition-colors",
            step === 1 || step === 2 ? "bg-primary" : "bg-muted"
          )} />
          <div className={cn(
            "flex-1 h-1.5 rounded-full transition-colors",
            step === 2 ? "bg-primary" : "bg-muted"
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

            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <Label className="text-sm font-semibold mb-3 block">Declared Value <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={declaredValue}
                  onChange={(e) => setDeclaredValue(e.target.value)}
                  placeholder="0"
                  className="h-11 pl-7 text-sm bg-muted/30 border-border rounded-xl"
                  data-testid="input-declared-value"
                />
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
            onClick={handleNext}
            className="flex-1 h-12 bg-primary hover:bg-primary/90 text-sm font-semibold rounded-xl shadow-md"
            data-testid="button-next-rates"
          >
            {step === 2 ? 'Get Rates' : 'Continue'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}