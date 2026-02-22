import { useState } from 'react';
import { ArrowLeft, Check, Package, User, MapPin, Send, ArrowRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { BottomNav } from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { calculateRateFromLb, serviceablePincodes, Shipment, TrackingEvent, lbToKg, inToCm } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const steps = [
  { id: 1, title: 'Sender', icon: User },
  { id: 2, title: 'Receiver', icon: MapPin },
  { id: 3, title: 'Package', icon: Package },
];

export default function CreateShipment() {
  const [, setLocation] = useLocation();
  const { isLoggedIn, user, addShipment, addNotification } = useAppStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newAWB, setNewAWB] = useState('');

  const [senderName, setSenderName] = useState(isLoggedIn ? `${user?.firstName} ${user?.lastName}` : '');
  const [senderEmail, setSenderEmail] = useState(isLoggedIn ? user?.email || '' : '');
  const [senderPhone, setSenderPhone] = useState(isLoggedIn ? user?.phone || '' : '');
  const [senderCity, setSenderCity] = useState('');
  const [senderState, setSenderState] = useState('');
  const [senderZip, setSenderZip] = useState('');
  const [senderAddress, setSenderAddress] = useState('');

  const [receiverName, setReceiverName] = useState('');
  const [receiverPhone, setReceiverPhone] = useState('');
  const [receiverCity, setReceiverCity] = useState('');
  const [receiverState, setReceiverState] = useState('');
  const [receiverPincode, setReceiverPincode] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [pincodeError, setPincodeError] = useState('');

  const [productType, setProductType] = useState<'Document' | 'Package'>('Package');
  const [serviceType, setServiceType] = useState<'Standard' | 'Express'>('Standard');
  const [weightUnit, setWeightUnit] = useState<'lb' | 'kg'>('lb');
  const [weight, setWeight] = useState('2');
  const [pieces, setPieces] = useState('1');
  const [dimUnit, setDimUnit] = useState<'in' | 'cm'>('in');
  const [dimL, setDimL] = useState('');
  const [dimW, setDimW] = useState('');
  const [dimH, setDimH] = useState('');

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background pb-20" data-testid="screen-create-login-required">
        <header className="sticky top-0 z-50 bg-white border-b-2 border-primary/20 safe-top">
          <div className="flex items-center h-14 px-4 max-w-md mx-auto">
            <button
              onClick={() => setLocation('/home')}
              className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="ml-2 font-semibold text-sm">Ship</h1>
          </div>
        </header>

        <main className="px-4 py-12 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Please login to continue</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to create and manage your shipments
          </p>
          <Button
            onClick={() => setLocation('/login?redirect=/create')}
            className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-xl shadow-md"
            data-testid="button-login-to-create"
          >
            Login
          </Button>
        </main>

        <BottomNav />
      </div>
    );
  }

  const validatePincode = (pincode: string) => {
    if (pincode.length === 6) {
      if (!serviceablePincodes.includes(pincode)) {
        setPincodeError('Not serviceable. Try: 400001, 110001');
        return false;
      }
      setPincodeError('');
      return true;
    }
    setPincodeError('');
    return false;
  };

  const handleNext = () => {
    if (currentStep === 2 && receiverPincode) {
      if (!validatePincode(receiverPincode)) {
        return;
      }
    }
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      setLocation('/home');
    }
  };

  const generateAWB = () => 'BMB' + Math.random().toString().slice(2, 11);

  const getWeightLb = (): number => {
    const w = parseFloat(weight) || 1;
    return weightUnit === 'lb' ? w : w / 0.453592;
  };

  const getWeightKg = (): number => {
    const w = parseFloat(weight) || 1;
    return weightUnit === 'kg' ? w : w * 0.453592;
  };

  const handleSubmit = () => {
    const awb = generateAWB();
    const now = new Date();
    const eta = new Date();
    eta.setDate(eta.getDate() + (serviceType === 'Express' ? 5 : 8));

    const weightLb = getWeightLb();
    const weightKg = getWeightKg();
    const priceEstimate = calculateRateFromLb(weightLb, serviceType);

    let dimLIn: number | undefined;
    let dimWIn: number | undefined;
    let dimHIn: number | undefined;
    let dimLCm: number | undefined;
    let dimWCm: number | undefined;
    let dimHCm: number | undefined;

    if (dimL || dimW || dimH) {
      if (dimUnit === 'in') {
        dimLIn = parseFloat(dimL) || undefined;
        dimWIn = parseFloat(dimW) || undefined;
        dimHIn = parseFloat(dimH) || undefined;
        dimLCm = dimLIn ? inToCm(dimLIn) : undefined;
        dimWCm = dimWIn ? inToCm(dimWIn) : undefined;
        dimHCm = dimHIn ? inToCm(dimHIn) : undefined;
      } else {
        dimLCm = parseFloat(dimL) || undefined;
        dimWCm = parseFloat(dimW) || undefined;
        dimHCm = parseFloat(dimH) || undefined;
        dimLIn = dimLCm ? dimLCm / 2.54 : undefined;
        dimWIn = dimWCm ? dimWCm / 2.54 : undefined;
        dimHIn = dimHCm ? dimHCm / 2.54 : undefined;
      }
    }

    const trackingEvents: TrackingEvent[] = [
      {
        id: `event-${Math.random().toString(36).slice(2)}`,
        status: 'Pickup Scheduled',
        note: 'Shipment pickup has been scheduled',
        location: `${senderCity}, ${senderState}, USA`,
        timestamp: now,
      },
    ];

    const shipment: Shipment = {
      id: Math.random().toString(36).slice(2),
      awb,
      userId: user?.id || '',
      originCountry: 'USA',
      originCity: senderCity,
      originState: senderState,
      originZip: senderZip,
      destCountry: 'India',
      destCity: receiverCity,
      destState: receiverState,
      destPincode: receiverPincode,
      weightLb: parseFloat(weightLb.toFixed(1)),
      weightKg: parseFloat(weightKg.toFixed(2)),
      pieces: parseInt(pieces) || 1,
      dimLIn,
      dimWIn,
      dimHIn,
      dimLCm,
      dimWCm,
      dimHCm,
      productType,
      serviceType,
      status: 'Pickup Scheduled',
      priceEstimate,
      eta,
      lastUpdateAt: now,
      createdAt: now,
      currency: 'USD',
      trackingEvents,
    };

    addShipment(shipment);
    addNotification({
      id: `notif-${Math.random().toString(36).slice(2)}`,
      userId: user?.id || '',
      title: 'Shipment Created',
      body: `Your shipment ${awb} has been created.`,
      severity: 'info',
      createdAt: now,
    });

    setNewAWB(awb);
    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background pb-20" data-testid="screen-create-success">
        <main className="px-4 py-16 max-w-md mx-auto text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale-in">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-foreground mb-2">Booking Confirmed!</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your shipment has been created
          </p>
          <div className="bg-card rounded-xl border border-border p-4 mb-6 inline-block shadow-sm">
            <p className="text-xs text-muted-foreground">AWB Number</p>
            <p className="text-xl font-bold text-primary mt-1">{newAWB}</p>
          </div>
          <div className="space-y-2">
            <Button
              onClick={() => setLocation(`/shipment/${newAWB}`)}
              className="w-full h-12 bg-primary text-sm rounded-xl shadow-md"
              data-testid="button-view-shipment"
            >
              View Shipment
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/receive')}
              className="w-full h-12 text-sm rounded-xl border-border"
              data-testid="button-view-orders"
            >
              Go to My Shipments
            </Button>
          </div>
        </main>

        <BottomNav />
      </div>
    );
  }

  const estimatedPrice = calculateRateFromLb(getWeightLb(), serviceType);

  return (
    <div className="min-h-screen bg-background pb-28" data-testid="screen-create">
      <header className="sticky top-0 z-50 bg-white border-b-2 border-primary/20 safe-top">
        <div className="flex items-center h-14 px-4 max-w-md mx-auto">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-back-create"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="ml-2 font-semibold text-sm">Create Shipment</h1>
        </div>
      </header>

      <div className="px-4 py-3 bg-white border-b border-border">
        <div className="flex items-center justify-between max-w-md mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                      isActive && 'bg-primary text-white',
                      isCompleted && 'bg-green-500 text-white',
                      !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={cn(
                    'text-[10px] mt-1',
                    isActive ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={cn(
                    'w-10 h-0.5 mx-1',
                    currentStep > step.id ? 'bg-green-500' : 'bg-muted'
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <main className="px-4 py-5 max-w-md mx-auto">
        {currentStep === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
              Origin: USA (fixed for this demo)
            </div>

            <div className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Full Name</Label>
                <Input
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  placeholder="John Doe"
                  className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                  data-testid="input-sender-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <Input
                    type="email"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-sender-email"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  <Input
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-sender-phone"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Address</Label>
                <Input
                  value={senderAddress}
                  onChange={(e) => setSenderAddress(e.target.value)}
                  placeholder="Street address"
                  className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                  data-testid="input-sender-address"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">City</Label>
                  <Input
                    value={senderCity}
                    onChange={(e) => setSenderCity(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-sender-city"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">State</Label>
                  <Input
                    value={senderState}
                    onChange={(e) => setSenderState(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-sender-state"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">ZIP</Label>
                  <Input
                    value={senderZip}
                    onChange={(e) => setSenderZip(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-sender-zip"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-700">
              Destination: India (fixed for this demo)
            </div>

            <div className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-sm">
              <div>
                <Label className="text-xs text-muted-foreground">Receiver Name</Label>
                <Input
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                  data-testid="input-receiver-name"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <Input
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  placeholder="+91"
                  className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                  data-testid="input-receiver-phone"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Address</Label>
                <Input
                  value={receiverAddress}
                  onChange={(e) => setReceiverAddress(e.target.value)}
                  className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                  data-testid="input-receiver-address"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">City</Label>
                  <Input
                    value={receiverCity}
                    onChange={(e) => setReceiverCity(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-receiver-city"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">State</Label>
                  <Input
                    value={receiverState}
                    onChange={(e) => setReceiverState(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    data-testid="input-receiver-state"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pincode</Label>
                  <Input
                    value={receiverPincode}
                    onChange={(e) => {
                      setReceiverPincode(e.target.value);
                      if (e.target.value.length === 6) validatePincode(e.target.value);
                    }}
                    maxLength={6}
                    className={cn('h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl', pincodeError && 'border-red-500')}
                    data-testid="input-receiver-pincode"
                  />
                </div>
              </div>
              {pincodeError && (
                <p className="text-xs text-red-500">{pincodeError}</p>
              )}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <Label className="text-sm font-semibold mb-3 block">Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['Document', 'Package'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setProductType(type)}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all text-sm font-medium',
                      productType === type
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border'
                    )}
                    data-testid={`button-product-${type.toLowerCase()}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <Label className="text-sm font-semibold mb-3 block">Service</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['Standard', 'Express'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setServiceType(type)}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all text-left',
                      serviceType === type
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                    data-testid={`button-service-${type.toLowerCase()}`}
                  >
                    <span className={cn(
                      'font-semibold text-sm',
                      serviceType === type ? 'text-primary' : ''
                    )}>
                      {type}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {type === 'Express' ? '~5 days' : '~8 days'}
                    </p>
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
                  <Label className="text-xs text-muted-foreground">Weight ({weightUnit})</Label>
                  <Input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    step="0.1"
                    min="0.1"
                    data-testid="input-package-weight"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pieces</Label>
                  <Input
                    type="number"
                    value={pieces}
                    onChange={(e) => setPieces(e.target.value)}
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                    min="1"
                    data-testid="input-package-pieces"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                ≈ {weightUnit === 'lb' ? `${(parseFloat(weight) * 0.453592).toFixed(2)} kg` : `${(parseFloat(weight) / 0.453592).toFixed(1)} lb`}
              </p>
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
                  <Label className="text-xs text-muted-foreground">L</Label>
                  <Input
                    type="number"
                    value={dimL}
                    onChange={(e) => setDimL(e.target.value)}
                    placeholder="12"
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">W</Label>
                  <Input
                    type="number"
                    value={dimW}
                    onChange={(e) => setDimW(e.target.value)}
                    placeholder="10"
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">H</Label>
                  <Input
                    type="number"
                    value={dimH}
                    onChange={(e) => setDimH(e.target.value)}
                    placeholder="8"
                    className="h-11 mt-1 text-sm bg-muted/30 border-border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estimated Total</span>
                <span className="text-2xl font-bold text-primary">${estimatedPrice}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Final charges may vary</p>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-border p-4 safe-bottom">
        <div className="max-w-md mx-auto">
          {currentStep < 3 ? (
            <Button
              onClick={handleNext}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-sm font-semibold rounded-xl shadow-md"
              data-testid="button-next-step"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-sm font-semibold rounded-xl shadow-md"
              data-testid="button-submit-shipment"
            >
              Create Shipment
            </Button>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}