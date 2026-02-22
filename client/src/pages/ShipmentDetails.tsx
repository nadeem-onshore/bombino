import { useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { ArrowLeft, Copy, Check, Plane, Download, MessageCircle, Phone, AlertTriangle, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { StatusBadge } from '@/components/StatusBadge';
import { TrackingTimeline } from '@/components/TrackingTimeline';
import type { TrackingEvent } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface DocketEvent {
  id: string;
  event_at: string;
  event_description: string;
  event_remark: string;
  event_state: string;
  event_location: string;
}

interface ITDTrackingResult {
  errors: boolean;
  tracking_no: string;
  chargeable_weight: string;
  forwarding_no: string;
  docket_info: [string, string][];
  docket_events: DocketEvent[];
}

function getDocketInfoValue(info: [string, string][], key: string): string {
  const entry = info.find(([k]) => k.toLowerCase().includes(key.toLowerCase()));
  return entry ? entry[1] : '';
}

function mapEvents(docketEvents: DocketEvent[]): TrackingEvent[] {
  return docketEvents.map((e) => ({
    id: e.id,
    status: e.event_description,
    note: e.event_remark || e.event_state || '',
    location: e.event_location || '',
    timestamp: new Date(e.event_at),
  }));
}

export default function ShipmentDetails() {
  const [, params] = useRoute('/shipment/:awb');
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);

  const awb = params?.awb || '';

  const { data, isLoading, error } = useQuery<ITDTrackingResult[]>({
    queryKey: ['/api/track', awb],
    queryFn: () =>
      fetch(`/api/track/${awb}`, { credentials: 'include' }).then((r) => {
        if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
        return r.json();
      }),
    enabled: !!awb,
    retry: false,
  });

  const copyAWB = () => {
    navigator.clipboard.writeText(awb);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background" data-testid="screen-shipment-loading">
        <header className="sticky top-0 z-50 bg-white border-b-2 border-primary/20 safe-top">
          <div className="flex items-center h-14 px-4 max-w-md mx-auto">
            <button
              onClick={() => setLocation(-1 as unknown as string)}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-2 font-semibold text-sm">Shipment Details</h1>
          </div>
        </header>
        <main className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    );
  }

  if (error || !data || data.length === 0 || data[0].errors) {
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
          <p className="text-sm text-muted-foreground mb-6">AWB: {awb}</p>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message.replace(/^\d+:\s*/, '') : 'No tracking data available'}
          </p>
        </main>
      </div>
    );
  }

  const result = data[0];
  const info = result.docket_info ?? [];
  const events = mapEvents(result.docket_events ?? []);

  const currentStatus = getDocketInfoValue(info, 'Status') || 'In Transit';
  const originCity = getDocketInfoValue(info, 'Origin');
  const destCity = getDocketInfoValue(info, 'Destination');
  const bookingDate = getDocketInfoValue(info, 'Booking Date') || getDocketInfoValue(info, 'Created');
  const isHoldOrException = currentStatus === 'Customs Hold' || currentStatus === 'Exception';

  return (
    <div className="min-h-screen bg-background pb-24" data-testid="screen-shipment-details">
      <header className="sticky top-0 z-50 bg-white border-b-2 border-primary/20 safe-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <button
            onClick={() => setLocation(-1 as unknown as string)}
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
                <span className="font-bold text-lg">{awb}</span>
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
              <StatusBadge status={currentStatus} className="mt-2" />
            </div>
          </div>

          <div className="flex items-center gap-3 py-3 border-y border-border">
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground">From</p>
              <p className="font-semibold text-sm">USA</p>
              {originCity && <p className="text-xs text-muted-foreground">{originCity}</p>}
            </div>
            <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center">
              <Plane className="w-5 h-5 text-primary rotate-45" />
            </div>
            <div className="flex-1 text-right">
              <p className="text-[10px] text-muted-foreground">To</p>
              <p className="font-semibold text-sm">India</p>
              {destCity && <p className="text-xs text-muted-foreground">{destCity}</p>}
            </div>
          </div>

          {bookingDate && (
            <div className="pt-3 text-sm">
              <p className="text-[10px] text-muted-foreground">Booking Date</p>
              <p className="font-semibold text-xs">{bookingDate}</p>
            </div>
          )}

          {info.length > 0 && (
            <div className="mt-3 space-y-1">
              {info.filter(([k]) => !['status', 'origin', 'destination', 'booking date', 'created'].some(s => k.toLowerCase().includes(s))).map(([k, v]) => (
                <div key={k} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-right ml-4">{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {isHoldOrException && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-4 mb-4 animate-slide-up">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-700 text-sm">{currentStatus}</h3>
                <p className="text-xs text-red-600 mt-1">Contact support for details.</p>
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

        {events.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 mb-4 shadow-sm">
            <h2 className="font-semibold text-sm text-foreground mb-3">Tracking History</h2>
            <TrackingTimeline events={events} currentStatus={currentStatus} />
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              AWB <span className="font-mono font-semibold text-foreground">{result.tracking_no}</span>
              {result.forwarding_no && (
                <> · Fwd <span className="font-mono font-semibold text-foreground">{result.forwarding_no}</span></>
              )}
            </p>
            {result.chargeable_weight && (
              <p className="text-xs text-muted-foreground mt-1">
                Chargeable weight: <span className="font-semibold text-foreground">{result.chargeable_weight} kg</span>
              </p>
            )}
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 safe-bottom">
        <div className="flex gap-2 max-w-md mx-auto">
          <Button
            variant="outline"
            className="flex-1 h-11 text-sm rounded-xl border-border"
            onClick={() => alert('Label download not available')}
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
