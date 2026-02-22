import { useState } from 'react';
import { useRoute, useLocation, Link } from 'wouter';
import { ArrowLeft, Copy, Check, Plane, Download, MessageCircle, Phone, AlertTriangle, Package } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { TrackingTimeline } from '@/components/TrackingTimeline';
import { getShipmentByAWB, sampleAWBs, inToCm } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

export default function ShipmentDetails() {
  const [, params] = useRoute('/shipment/:awb');
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const awb = params?.awb || '';
  const shipment = getShipmentByAWB(awb);

  const copyAWB = () => {
    if (shipment) {
      navigator.clipboard.writeText(shipment.awb);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!shipment) {
    return (
      <div className="min-h-screen bg-background" data-testid="screen-shipment-not-found">
        <header className="sticky top-0 z-50 bg-white border-b-2 border-primary/20 safe-top">
          <div className="flex items-center h-14 px-4 max-w-md mx-auto">
            <button
              onClick={() => setLocation('/receive')}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-2 font-semibold text-sm">Shipment Details</h1>
          </div>
        </header>

        <main className="px-4 py-12 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Shipment Not Found</h2>
          <p className="text-sm text-muted-foreground mb-6">
            AWB: {awb}
          </p>
          <div className="bg-card rounded-xl border border-border p-4 mb-6 shadow-sm">
            <p className="text-xs text-muted-foreground mb-2">Try these samples:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {sampleAWBs.map((sampleAwb) => (
                <Link
                  key={sampleAwb}
                  href={`/shipment/${sampleAwb}`}
                  className="text-sm font-mono bg-primary/10 text-primary px-3 py-1.5 rounded-lg font-medium"
                >
                  {sampleAwb}
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const isHoldOrException = shipment.status === 'Customs Hold' || shipment.status === 'Exception';

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="screen-shipment-details">
      <header className="sticky top-0 z-50 bg-white border-b-2 border-primary/20 safe-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <button
            onClick={() => setLocation(-1 as any)}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 font-semibold text-sm">Shipment Details</h1>
        </div>
      </header>

      <main className="px-4 py-5 max-w-md mx-auto">
        <div className="bg-card rounded-2xl border border-border p-4 mb-4 animate-fade-in shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg">{shipment.awb}</span>
                <button
                  onClick={copyAWB}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  data-testid="button-copy-awb"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              </div>
              <StatusBadge status={shipment.status} className="mt-2" />
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-y border-border">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">From</p>
              <p className="font-semibold text-sm">{shipment.originCountry}</p>
              <p className="text-xs text-muted-foreground">{shipment.originCity}</p>
            </div>
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary rotate-45" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[10px] text-muted-foreground">To</p>
              <p className="font-semibold text-sm">{shipment.destCountry}</p>
              <p className="text-xs text-muted-foreground">{shipment.destCity}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 text-sm">
            <div>
              <p className="text-[10px] text-muted-foreground">Created</p>
              <p className="font-semibold text-xs">{format(shipment.createdAt, 'MMM d')}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Updated</p>
              <p className="font-semibold text-xs">{format(shipment.lastUpdateAt, 'MMM d')}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">ETA</p>
              <p className="font-semibold text-xs">{format(shipment.eta, 'MMM d')}</p>
            </div>
          </div>
        </div>

        {isHoldOrException && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 mb-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 text-sm">
                  {shipment.status === 'Customs Hold' ? 'Customs Hold' : 'Exception'}
                </h3>
                <p className="text-xs text-red-600 mt-1">
                  {shipment.statusReason || 'Contact support for details.'}
                </p>
                <a
                  href="https://wa.me/0000000000?text=Hi%20Bombino%20Support"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-700"
                  data-testid="link-support-hold"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Contact Support
                </a>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-4 mb-4 shadow-sm">
          <h2 className="font-semibold text-sm text-foreground mb-3">Tracking History</h2>
          <TrackingTimeline events={shipment.trackingEvents} currentStatus={shipment.status} />
        </div>

        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <h2 className="font-semibold text-sm text-foreground">Package Details</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground">Service</p>
              <p className="font-semibold text-xs">{shipment.serviceType}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground">Type</p>
              <p className="font-semibold text-xs">{shipment.productType}</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground">Weight</p>
              <p className="font-semibold text-xs">{shipment.weightLb} lb</p>
              <p className="text-[10px] text-muted-foreground">{shipment.weightKg.toFixed(2)} kg</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-[10px] text-muted-foreground">Pieces</p>
              <p className="font-semibold text-xs">{shipment.pieces}</p>
            </div>
            {shipment.dimLIn && shipment.dimWIn && shipment.dimHIn && (
              <div className="col-span-2 bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] text-muted-foreground">Dimensions</p>
                <p className="font-semibold text-xs">
                  {shipment.dimLIn.toFixed(0)} × {shipment.dimWIn.toFixed(0)} × {shipment.dimHIn.toFixed(0)} in
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {inToCm(shipment.dimLIn).toFixed(0)} × {inToCm(shipment.dimWIn).toFixed(0)} × {inToCm(shipment.dimHIn).toFixed(0)} cm
                </p>
              </div>
            )}
            <div className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-3 border border-primary/20">
              <p className="text-[10px] text-muted-foreground">Estimated Cost</p>
              <p className="font-bold text-xl text-primary">${shipment.priceEstimate}</p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 safe-bottom">
        <div className="flex gap-2 max-w-md mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-11 text-sm rounded-xl border-border"
            onClick={() => alert('Mock: Downloading label...')}
            data-testid="button-download-label"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Label
          </Button>
          <a
            href="https://wa.me/0000000000?text=Hi%20Bombino%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 bg-green-50 border border-green-200 rounded-xl flex items-center justify-center hover:bg-green-100 transition-colors"
            data-testid="button-whatsapp"
          >
            <MessageCircle className="w-5 h-5 text-green-600" />
          </a>
          <a
            href="tel:+10000000000"
            className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center hover:bg-primary/20 transition-colors"
            data-testid="button-call"
          >
            <Phone className="w-5 h-5 text-primary" />
          </a>
        </div>
      </div>
    </div>
  );
}