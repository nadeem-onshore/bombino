import { useState } from 'react';
import { ArrowLeft, Mail, Phone, Key } from 'lucide-react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore, demoUser } from '@/lib/store';
import bombinoLogo from '@assets/generated_images/bombino_express_logo_design.png';
import { cn } from '@/lib/utils';

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAppStore();
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [error, setError] = useState('');

  const handleSendOTP = () => {
    if (!emailOrPhone.trim()) {
      setError('Please enter your email or phone number');
      return;
    }
    const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOTP(newOTP);
    setStep('otp');
    setError('');
  };

  const handleVerifyOTP = () => {
    if (otp === generatedOTP) {
      login(demoUser);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || '/home';
      setLocation(redirect);
    } else {
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background safe-top safe-bottom" data-testid="screen-login">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="flex items-center h-14 px-4">
          <button
            onClick={() => setLocation('/home')}
            className="p-2 -ml-2 rounded-lg hover:bg-muted transition-colors"
            data-testid="button-back-login"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="ml-2 font-semibold">Sign In</h1>
        </div>
      </header>

      <main className="px-6 py-8">
        <div className="flex flex-col items-center mb-8">
          <img src={bombinoLogo} alt="Bombino Express" className="h-16 w-auto mb-2" />
          <p className="text-sm text-muted-foreground">Bringing the world closer</p>
        </div>

        {step === 'input' ? (
          <div className="space-y-6 animate-fade-in">
            <div>
              <Label className="text-sm font-medium">Email or Mobile Number</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={emailOrPhone}
                  onChange={(e) => {
                    setEmailOrPhone(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter email or phone"
                  className="pl-10 h-14"
                  data-testid="input-email-phone"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              onClick={handleSendOTP}
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90"
              data-testid="button-send-otp"
            >
              Send OTP
            </Button>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Sign up
                </Link>
              </p>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-sm text-muted-foreground hover:underline">
                Forgot access?
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
              <p className="text-sm text-emerald-700">Demo OTP (enter this code):</p>
              <p className="text-3xl font-bold text-emerald-700 tracking-widest mt-2">
                {generatedOTP}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Enter OTP</Label>
              <div className="relative mt-2">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setError('');
                  }}
                  placeholder="6-digit OTP"
                  className="pl-10 h-14 text-center text-xl tracking-widest"
                  maxLength={6}
                  data-testid="input-otp"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <Button
              onClick={handleVerifyOTP}
              disabled={otp.length !== 6}
              className="w-full h-14 text-base font-semibold bg-primary hover:bg-primary/90 disabled:opacity-50"
              data-testid="button-verify-otp"
            >
              Verify & Sign In
            </Button>

            <button
              onClick={() => {
                setStep('input');
                setOtp('');
                setError('');
              }}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-change-number"
            >
              Change email/phone
            </button>
          </div>
        )}
      </main>
    </div>
  );
}