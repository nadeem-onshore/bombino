import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Search, ArrowRight, BadgeDollarSign, Send, MessageCircle, Phone, Bell, ChevronRight } from 'lucide-react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { SideMenu } from '@/components/SideMenu';
import { StatusBadge } from '@/components/StatusBadge';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import globeImage from '@assets/generated_images/globe_with_shipping_routes.png';
import packagesImage from '@assets/generated_images/packages_being_shipped_fast.png';
import customersImage from '@assets/generated_images/happy_global_customers.png';

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [, setLocation] = useLocation();
  const { isLoggedIn, user, shipments, notifications } = useAppStore();

  const userShipments = isLoggedIn 
    ? shipments.filter(s => s.userId === user?.id).slice(0, 2) 
    : [];
  const userNotifications = isLoggedIn 
    ? notifications.filter(n => n.userId === user?.id).slice(0, 2) 
    : [];

  const handleTrack = () => {
    if (trackingNumber.trim()) {
      setLocation(`/shipment/${trackingNumber.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="screen-home">
      <Header onMenuClick={() => setMenuOpen(true)} />
      <SideMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="px-4 py-5 max-w-md mx-auto space-y-6">
        {isLoggedIn && (
          <p className="text-muted-foreground text-sm -mb-2">
            Welcome back, <span className="font-semibold text-foreground">{user?.firstName}</span>
          </p>
        )}

        {/* ZONE 1: Hero - Track Shipment (Primary Action) */}
        <div 
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border border-primary/10 p-5 shadow-[0_8px_24px_rgba(198,40,40,0.08)]"
          data-testid="zone-hero"
        >
          <div className="relative z-10">
            <h1 className="text-lg font-semibold text-foreground mb-1">Track your shipment</h1>
            <p className="text-sm text-muted-foreground mb-4">Enter AWB number to get real-time status</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g. BMB123456789"
                  className="h-12 pl-10 text-sm bg-white border-border rounded-xl shadow-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleTrack()}
                  data-testid="input-tracking"
                />
              </div>
              <Button
                onClick={handleTrack}
                className="h-12 px-5 bg-primary hover:bg-primary/90 rounded-xl shadow-lg shadow-primary/25 active:scale-[0.97] transition-all font-semibold"
                data-testid="button-track"
              >
                Track
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>

        {/* ZONE 2: Action Strip - Core Actions */}
        <div className="flex gap-3" data-testid="zone-actions">
          <Link
            href="/rates"
            className="flex-1 flex items-center gap-3 p-3.5 bg-white rounded-xl border border-border hover:border-amber-200 hover:bg-amber-50/30 active:scale-[0.98] transition-all"
            data-testid="button-get-rates"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <BadgeDollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Get Rates</p>
              <p className="text-[11px] text-muted-foreground">Check costs</p>
            </div>
          </Link>

          <Link
            href="/create"
            className="flex-1 flex items-center gap-3 p-3.5 bg-white rounded-xl border border-border hover:border-emerald-200 hover:bg-emerald-50/30 active:scale-[0.98] transition-all"
            data-testid="button-ship"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <Send className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">Ship Now</p>
              <p className="text-[11px] text-muted-foreground">Create shipment</p>
            </div>
          </Link>
        </div>

        {/* ZONE 3: Auth Banner (Guest Only) */}
        {!isLoggedIn && (
          <div className="flex items-center justify-between py-3 px-1" data-testid="zone-auth">
            <p className="text-sm text-muted-foreground">Sign in to manage your shipments</p>
            <div className="flex gap-2">
              <Link href="/login">
                <Button size="sm" className="h-9 px-4 bg-primary hover:bg-primary/90 rounded-lg text-xs font-medium shadow-sm" data-testid="button-login">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" variant="outline" className="h-9 px-4 rounded-lg text-xs font-medium border-border text-foreground hover:bg-muted" data-testid="button-signup">
                  Sign Up
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* ZONE 4: Support + Trust (Guest Only, Lightweight) */}
        {!isLoggedIn && (
          <>
            {/* Support Pills */}
            <div className="flex gap-2" data-testid="zone-support">
              <a
                href="https://wa.me/0000000000?text=Hi%20Bombino%20Support"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 active:scale-[0.97] transition-all"
                data-testid="button-whatsapp-home"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <a
                href="tel:+10000000000"
                className="flex-1 flex items-center justify-center gap-2 h-10 rounded-full bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 active:scale-[0.97] transition-all"
                data-testid="button-call-home"
              >
                <Phone className="w-4 h-4" />
                Call Us
              </a>
            </div>

            {/* Why Bombino - Enhanced Section */}
            <div className="rounded-2xl overflow-hidden" data-testid="zone-trust">
              <div className="bg-gradient-to-br from-primary/8 to-primary/3 px-5 py-4">
                <h2 className="text-base font-semibold text-foreground mb-1">Why Bombino?</h2>
                <p className="text-xs text-muted-foreground">Trusted by businesses across the world</p>
              </div>
              
              <div className="bg-white p-4 space-y-3">
                {/* 30 Years */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-transparent border border-blue-100/50">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-blue-100 flex-shrink-0">
                    <img src={globeImage} alt="Global shipping" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-foreground">30+ Years</p>
                    <p className="text-xs text-muted-foreground">Of excellence in USA-India shipping</p>
                  </div>
                </div>

                {/* 140kg/hour */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-transparent border border-amber-100/50">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-amber-100 flex-shrink-0">
                    <img src={packagesImage} alt="Fast shipping" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-foreground">140 kg</p>
                    <p className="text-xs text-muted-foreground">Shipped every hour, non-stop</p>
                  </div>
                </div>

                {/* 250+ Clients */}
                <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-transparent border border-emerald-100/50">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-emerald-100 flex-shrink-0">
                    <img src={customersImage} alt="Happy customers" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xl font-bold text-foreground">250+</p>
                    <p className="text-xs text-muted-foreground">Happy clients across the world</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Logged-in: My Shipments */}
        {isLoggedIn && userShipments.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">My Shipments</h2>
              <Link href="/receive" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {userShipments.map((shipment) => (
                <Link
                  key={shipment.id}
                  href={`/shipment/${shipment.awb}`}
                  className="block bg-white rounded-xl border border-border p-4 hover:border-primary/20 hover:shadow-sm active:scale-[0.99] transition-all"
                  data-testid={`shipment-card-${shipment.awb}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{shipment.awb}</span>
                    <StatusBadge status={shipment.status} />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{shipment.destCity}, {shipment.destCountry}</span>
                    <span>${shipment.priceEstimate}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Logged-in: Recent Updates */}
        {isLoggedIn && userNotifications.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-medium text-foreground">Recent Updates</h2>
              <Link href="/notifications" className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {userNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-border"
                  data-testid={`notification-${notif.id}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    notif.severity === 'warn' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <Bell className={`w-4 h-4 ${
                      notif.severity === 'warn' ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground">{notif.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{notif.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logged-in: Empty State */}
        {isLoggedIn && userShipments.length === 0 && (
          <div className="text-center py-8">
            <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-primary" />
            </div>
            <p className="font-medium text-foreground text-sm mb-1">No shipments yet</p>
            <p className="text-xs text-muted-foreground mb-4">Create your first shipment to get started</p>
            <Button
              onClick={() => setLocation('/create')}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-sm h-10 px-5 rounded-xl shadow-md"
            >
              Create Shipment
            </Button>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}