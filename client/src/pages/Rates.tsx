import { useState } from 'react';
import { ArrowLeft, Zap, Loader2, AlertTriangle } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { lbToKg, kgToLb } from '@/lib/mockData';
import { apiRequest } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

interface RateParams {
  product_code: string;
  destination_code: string;
  booking_date: string;
  origin_code: string;
  pcs: string;
  actual_weight: string;
}

interface ITDServiceOption {
  internal_api_service_code: string;
  total: number;
}

interface ITDRateResponse {
  success?: boolean;
  data?: ITDServiceOption[];
}

interface ShipmentMeta {
  weightLb: number;
  weightKg: number;
  pieces: number;
}

export default function Rates() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [weight, setWeight] = useState('2');
  const [pieces, setPieces] = useState('1');

  const [rateResults, setRateResults] = useState<ITDServiceOption[] | null>(null);
  const [shipmentMeta, setShipmentMeta] = useState<ShipmentMeta | null>(null);
  const [apiError, setApiError] = useState('');

  const rateMutation = useMutation({
    mutationFn: (params: RateParams) =>
      apiRequest('POST', '/api/rates', params).then((r) => r.json() as Promise<ITDRateResponse>),
    onSuccess: (data) => {
      const w = parseFloat(weight) || 1;
      const weightLb = weightUnit === 'lb' ? w : kgToLb(w);
      const weightKg = weightUnit === 'kg' ? w : lbToKg(w);

      const services: ITDServiceOption[] = Array.isArray(data)
        ? (data as ITDServiceOption[])
        : Array.isArray(data?.data)
        ? data.data
        : [];

      if (services.length === 0) {
        setApiError('No rates available for this shipment.');
      } else {
        setShipmentMeta({
          weightLb: parseFloat(weightLb.toFixed(1)),
          weightKg: parseFloat(weightKg.toFixed(2)),
          pieces: parseInt(pieces) || 1,
        });
        setRateResults(services);
      }
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message.replace(/^\d+:\s*/, '') : 'Rate calculation failed';
      setApiError(msg);
    },
  });

  const handleGetRates = () => {
    setApiError('');
    const w = parseFloat(weight) || 1;
    const weightLb = weightUnit === 'lb' ? w : kgToLb(w);

    rateMutation.mutate({
      product_code: 'SPX',
      destination_code: 'US',
      booking_date: new Date().toISOString().split('T')[0],
      origin_code: 'IN',
      pcs: String(parseInt(pieces) || 1),
      actual_weight: String(weightLb.toFixed(2)),
    });
  };

  const handleBack = () => {
    if (rateResults) {
      setRateResults(null);
      setShipmentMeta(null);
    } else {
      setLocation('/home');
    }
  };

  if (rateResults && shipmentMeta) {
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
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Weight</p>
                <p className="font-semibold">{shipmentMeta.weightLb} lb</p>
                <p className="text-[10px] text-muted-foreground">{shipmentMeta.weightKg} kg</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground mb-0.5">Pieces</p>
                <p className="font-semibold">{shipmentMeta.pieces}</p>
                <p className="text-[10px] text-muted-foreground">India → USA</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {rateResults.map((service, idx) => (
              <div
                key={idx}
                className="bg-card rounded-xl border border-border p-4 shadow-sm"
                data-testid={`rate-card-${idx}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Zap className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground text-sm leading-tight">
                        {service.internal_api_service_code}
                      </h3>
                    </div>
                  </div>
                  <span className="text-xl font-bold text-primary ml-3 flex-shrink-0">
                    ₹{service.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
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
        <p className="text-sm text-muted-foreground mb-5">India → USA shipping</p>

        <div className="space-y-4">
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
            <Label className="text-sm font-semibold mb-3 block">Route</Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">From</Label>
                <select
                  disabled
                  className="w-full h-11 px-3 text-sm bg-muted/30 border border-border rounded-xl text-foreground cursor-not-allowed appearance-none"
                  data-testid="select-origin"
                >
                  <option value="IN">🇮🇳 India (IN)</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px] text-muted-foreground mb-1 block">To</Label>
                <select
                  disabled
                  className="w-full h-11 px-3 text-sm bg-muted/30 border border-border rounded-xl text-foreground cursor-not-allowed appearance-none"
                  data-testid="select-destination"
                >
                  <option value="US">🇺🇸 USA (US)</option>
                </select>
              </div>
            </div>
          </div>

          {apiError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-600">{apiError}</p>
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border p-4 safe-bottom">
        <div className="max-w-md mx-auto">
          <Button
            onClick={handleGetRates}
            disabled={rateMutation.isPending}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-sm font-semibold rounded-xl shadow-md disabled:opacity-70"
            data-testid="button-get-rates"
          >
            {rateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Get Rates'
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
