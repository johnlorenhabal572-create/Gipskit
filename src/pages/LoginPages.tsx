import { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  LogIn, 
  UserPlus, 
  KeyRound,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

const LoginPage = () => {
  // Main Tab: 'signin' or 'signup'
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up Multi-step State
  // Step 1 = Enter Gmail (Username)
  // Step 2 = Enter 6-digit Verification Code
  // Step 3 = Create Password (8 chars, 1 uppercase, 1 number)
  const [signUpStep, setSignUpStep] = useState<1 | 2 | 3>(1);
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, sendSignUpCode, verifySignUpCode, completeSignUp } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || null;

  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for resending OTP
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleRedirect = (user: any) => {
    if (from) {
      navigate(from);
    } else if (user?.role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate('/menu');
    }
  };

  // Gmail Validator
  const isGmailValid = (email: string) => {
    return /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(email.trim());
  };

  // Password Rules Validation:
  // 1. Total length exactly 8 characters
  // 2. Contains at least 1 uppercase letter
  // 3. Contains at least 1 number
  const passwordRules = {
    exactEightChars: signUpPassword.length === 8,
    hasUppercase: /[A-Z]/.test(signUpPassword),
    hasNumber: /[0-9]/.test(signUpPassword),
    passwordsMatch: signUpPassword.length > 0 && signUpPassword === confirmPassword
  };

  const isPasswordFullyValid = 
    passwordRules.exactEightChars && 
    passwordRules.hasUppercase && 
    passwordRules.hasNumber;

  // -------------------------------------------------------------
  // SIGN IN HANDLER
  // -------------------------------------------------------------
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanEmail = signInEmail.trim();
    if (!cleanEmail) {
      setError('Please enter your Gmail / username.');
      return;
    }

    if (!signInPassword) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const user = await login(cleanEmail, signInPassword);
      handleRedirect(user);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SIGN UP - STEP 1: Send Gmail Verification Code
  // -------------------------------------------------------------
  const handleSendVerificationCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMsg('');

    const cleanEmail = signUpEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError('Please enter your Gmail address.');
      return;
    }

    if (!isGmailValid(cleanEmail)) {
      setError('Username must be a valid Gmail account ending in @gmail.com');
      return;
    }

    setLoading(true);
    try {
      const res = await sendSignUpCode(cleanEmail);
      setSignUpStep(2);
      setResendCooldown(60);
      setInfoMsg(res.message || `Verification code sent to ${cleanEmail}`);
      if (res.previewCode) {
        setPreviewCode(res.previewCode);
      }
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please check your network.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SIGN UP - STEP 2: Verify 6-Digit Code
  // -------------------------------------------------------------
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otpCode];
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d;
      });
      setOtpCode(newOtp);
      const nextIndex = Math.min(index + digits.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    const digit = value.replace(/\D/g, '');
    const newOtp = [...otpCode];
    newOtp[index] = digit;
    setOtpCode(newOtp);

    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setInfoMsg('');

    const fullCode = otpCode.join('').trim();
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifySignUpCode(signUpEmail, fullCode);
      setInfoMsg('Code verified! You can now create your password.');
      setSignUpStep(3);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // -------------------------------------------------------------
  // SIGN UP - STEP 3: Create Password & Complete Registration
  // -------------------------------------------------------------
  const handleCompleteSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    if (!isPasswordFullyValid) {
      setError('Password must have 1 capital letter, a number, and exactly 8 characters total.');
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      const user = await completeSignUp(signUpEmail, signUpPassword, signUpName);
      handleRedirect(user);
    } catch (err: any) {
      setError(err.message || 'Failed to complete registration.');
    } finally {
      setLoading(false);
    }
  };

  const resetSignUpFlow = () => {
    setSignUpStep(1);
    setOtpCode(['', '', '', '', '', '']);
    setSignUpPassword('');
    setConfirmPassword('');
    setError('');
    setInfoMsg('');
    setPreviewCode(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-gray-50/50">
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        
        {/* Navigation Tabs (Sign In / Sign Up) */}
        <div className="flex border-b border-gray-100 bg-gray-50/60 p-2 gap-2">
          <button 
            type="button"
            id="tab-signin"
            onClick={() => { 
              setActiveTab('signin'); 
              setError(''); 
              setInfoMsg(''); 
            }}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signin' 
                ? 'bg-white text-dark shadow-sm border border-gray-100' 
                : 'text-gray-400 hover:text-dark'
            }`}
          >
            <LogIn size={16} className={activeTab === 'signin' ? 'text-primary' : ''} />
            Sign In
          </button>
          
          <button 
            type="button"
            id="tab-signup"
            onClick={() => { 
              setActiveTab('signup'); 
              resetSignUpFlow();
            }}
            className={`flex-1 py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              activeTab === 'signup' 
                ? 'bg-white text-dark shadow-sm border border-gray-100' 
                : 'text-gray-400 hover:text-dark'
            }`}
          >
            <UserPlus size={16} className={activeTab === 'signup' ? 'text-primary' : ''} />
            Sign Up
          </button>
        </div>

        <div className="p-8 sm:p-10">
          
          {/* Alerts & Notifications */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-xs font-bold border border-red-100 flex items-start gap-3"
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </motion.div>
            )}
            
            {infoMsg && (
              <motion.div 
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-green-50 text-green-700 p-4 rounded-2xl mb-6 text-xs font-bold border border-green-100 flex items-start gap-3"
              >
                <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-green-600" />
                <div className="flex-1">
                  <p className="leading-relaxed">{infoMsg}</p>
                  {previewCode && (
                    <div className="mt-2.5 bg-white/90 p-2.5 rounded-xl border border-green-200 inline-block">
                      <span className="text-[10px] uppercase font-black tracking-wider text-gray-500 block mb-0.5">Verification Code</span>
                      <span className="font-mono text-base font-black text-primary tracking-widest">{previewCode}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ================================================================= */}
          {/* SIGN IN TAB */}
          {/* ================================================================= */}
          {activeTab === 'signin' && (
            <div>
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-4 shadow-inner">
                  <LogIn size={28} />
                </div>
                <h2 className="text-3xl font-black text-dark tracking-tight">
                  Welcome Back
                </h2>
                <p className="text-gray-400 text-sm mt-2">
                  Sign in with your Gmail username and password
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                {/* Step 1: Enter Gmail (Username) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Gmail (Username)
                  </label>
                  <div className="relative group">
                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      type="email" 
                      id="signin-email-input"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold text-dark text-sm placeholder:text-gray-300"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                {/* Step 2: Enter Password */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input 
                      type={showSignInPassword ? 'text' : 'password'}
                      id="signin-password-input"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 pr-12 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold text-dark text-sm placeholder:text-gray-300"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark transition-colors"
                      tabIndex={-1}
                    >
                      {showSignInPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  id="signin-submit-btn"
                  disabled={loading}
                  className="w-full bg-dark text-white py-4 rounded-2xl hover:bg-primary font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-gray-200 mt-6 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-400">
                  Don't have an account yet?{' '}
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('signup'); resetSignUpFlow(); }}
                    className="font-black text-primary hover:underline ml-1"
                  >
                    Create Account
                  </button>
                </p>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SIGN UP TAB (Multi-Step Flow) */}
          {/* ================================================================= */}
          {activeTab === 'signup' && (
            <div>
              {/* Progress Indicator */}
              <div className="mb-8">
                <div className="flex items-center justify-between relative mb-2">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gray-100 w-full -z-0"></div>
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-300 -z-0"
                    style={{ width: signUpStep === 1 ? '0%' : signUpStep === 2 ? '50%' : '100%' }}
                  ></div>

                  {/* Step 1 Pill */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition-all ${
                    signUpStep >= 1 ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {signUpStep > 1 ? <Check size={14} /> : '1'}
                  </div>

                  {/* Step 2 Pill */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition-all ${
                    signUpStep >= 2 ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'
                  }`}>
                    {signUpStep > 2 ? <Check size={14} /> : '2'}
                  </div>

                  {/* Step 3 Pill */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black z-10 transition-all ${
                    signUpStep === 3 ? 'bg-primary text-white shadow-md' : 'bg-gray-100 text-gray-400'
                  }`}>
                    3
                  </div>
                </div>

                <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-400 px-1">
                  <span>1. Enter Gmail</span>
                  <span>2. Verify Code</span>
                  <span>3. Create Password</span>
                </div>
              </div>

              {/* ------------------------------------------------------------- */}
              {/* SIGN UP STEP 1: Enter Gmail (Username) */}
              {/* ------------------------------------------------------------- */}
              {signUpStep === 1 && (
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-dark tracking-tight">Create Account</h3>
                    <p className="text-gray-400 text-xs mt-1">Your Gmail address will act as your username</p>
                  </div>

                  <form onSubmit={handleSendVerificationCode} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Full Name (Optional)
                      </label>
                      <input 
                        type="text" 
                        id="signup-name-input"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        placeholder="e.g. Juan Dela Cruz"
                        className="w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold text-dark text-sm placeholder:text-gray-300"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Gmail Address <span className="text-primary">*</span>
                      </label>
                      <div className="relative group">
                        <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          type="email" 
                          id="signup-email-input"
                          value={signUpEmail}
                          onChange={(e) => setSignUpEmail(e.target.value)}
                          placeholder="username@gmail.com"
                          className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold text-dark text-sm placeholder:text-gray-300"
                          required
                          autoFocus
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 ml-1">Must be a valid Gmail account (e.g. name@gmail.com)</p>
                    </div>

                    <button 
                      type="submit" 
                      id="signup-sendcode-btn"
                      disabled={loading}
                      className="w-full bg-dark text-white py-4 rounded-2xl hover:bg-primary font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-gray-200 mt-6 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <>
                          <span>Send Verification Code</span>
                          <ArrowRight size={16} />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SIGN UP STEP 2: Enter Verification Code */}
              {/* ------------------------------------------------------------- */}
              {signUpStep === 2 && (
                <div>
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-black text-dark tracking-tight">Enter Verification Code</h3>
                    <p className="text-gray-400 text-xs mt-1">
                      Sent to <strong className="text-dark">{signUpEmail}</strong>
                    </p>
                  </div>

                  <form onSubmit={handleVerifyCode} className="space-y-6">
                    <div>
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {otpCode.map((digit, index) => (
                          <input
                            key={index}
                            ref={(el) => {
                              otpInputRefs.current[index] = el;
                            }}
                            type="text"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black text-dark bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            autoComplete="one-time-code"
                            inputMode="numeric"
                          />
                        ))}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      id="signup-verifycode-btn"
                      disabled={loading || otpCode.join('').length !== 6}
                      className="w-full bg-dark text-white py-4 rounded-2xl hover:bg-primary font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-gray-200 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {loading ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <>
                          <ShieldCheck size={18} />
                          <span>Verify Code</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <button
                        type="button"
                        onClick={() => { setSignUpStep(1); setError(''); }}
                        className="text-gray-400 hover:text-dark font-bold underline"
                      >
                        Change Gmail
                      </button>
                      
                      <button
                        type="button"
                        disabled={resendCooldown > 0 || loading}
                        onClick={() => handleSendVerificationCode()}
                        className="text-primary hover:text-dark font-bold disabled:text-gray-300"
                      >
                        {resendCooldown > 0 ? `Resend code (${resendCooldown}s)` : 'Resend code'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* ------------------------------------------------------------- */}
              {/* SIGN UP STEP 3: Create Password */}
              {/* ------------------------------------------------------------- */}
              {signUpStep === 3 && (
                <div>
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                      <KeyRound size={22} />
                    </div>
                    <h3 className="text-2xl font-black text-dark tracking-tight">Create Password</h3>
                    <p className="text-gray-400 text-xs mt-1">Set a secure 8-character password for {signUpEmail}</p>
                  </div>

                  <form onSubmit={handleCompleteSignUp} className="space-y-4">
                    {/* Password Input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        New Password (8 characters)
                      </label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showSignUpPassword ? 'text' : 'password'}
                          id="signup-password-input"
                          maxLength={8}
                          value={signUpPassword}
                          onChange={(e) => setSignUpPassword(e.target.value)}
                          placeholder="e.g. Pass1234"
                          className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 pr-12 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold text-dark text-sm placeholder:text-gray-300"
                          required
                          autoFocus
                        />
                        <button 
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-dark transition-colors"
                          tabIndex={-1}
                        >
                          {showSignUpPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                        Confirm Password
                      </label>
                      <div className="relative group">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                        <input 
                          type={showSignUpPassword ? 'text' : 'password'}
                          id="signup-confirmpassword-input"
                          maxLength={8}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter 8-character password"
                          className="w-full bg-gray-50 border border-gray-100 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none font-bold text-dark text-sm placeholder:text-gray-300"
                          required
                        />
                      </div>
                    </div>

                    {/* Password Rules Live Checklist */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                      <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Password Requirements:</p>
                      <div className="space-y-1.5 text-xs font-bold">
                        <div className={`flex items-center gap-2 ${passwordRules.exactEightChars ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordRules.exactEightChars ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-gray-300" />}
                          <span>Exactly 8 characters total ({signUpPassword.length}/8)</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordRules.hasUppercase ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordRules.hasUppercase ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-gray-300" />}
                          <span>At least 1 uppercase / capital letter (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-2 ${passwordRules.hasNumber ? 'text-green-600' : 'text-gray-400'}`}>
                          {passwordRules.hasNumber ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-gray-300" />}
                          <span>At least 1 number (0-9)</span>
                        </div>
                        {confirmPassword.length > 0 && (
                          <div className={`flex items-center gap-2 ${passwordRules.passwordsMatch ? 'text-green-600' : 'text-red-500'}`}>
                            {passwordRules.passwordsMatch ? <Check size={14} className="text-green-600" /> : <X size={14} className="text-red-500" />}
                            <span>{passwordRules.passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      id="signup-complete-btn"
                      disabled={loading || !isPasswordFullyValid || signUpPassword !== confirmPassword}
                      className="w-full bg-dark text-white py-4 rounded-2xl hover:bg-primary font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-gray-200 mt-6 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      {loading ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          <span>Create Account & Sign In</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              <div className="mt-8 text-center">
                <p className="text-xs text-gray-400">
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => { setActiveTab('signin'); setError(''); }}
                    className="font-black text-primary hover:underline ml-1"
                  >
                    Sign In
                  </button>
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LoginPage;
