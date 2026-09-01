import { ShoppingBag, Store, Clock, Utensils, MapPin, Phone, Facebook, Sparkles, CheckCircle2 } from 'lucide-react';
import { IMAGES } from '../constants/images';
import { Link } from 'react-router-dom';

const About = () => {
  const pickupPillars = [
    {
      title: "Order Ahead From Anywhere",
      description: "Browse our full sizzling menu online from your phone or laptop. Choose your favorites and submit your order in seconds before heading over.",
      icon: <ShoppingBag size={24} className="text-dark" />
    },
    {
      title: "Fresh Kitchen Preparation",
      description: "Our kitchen crew prepares your sizzling dishes with fresh ingredients upon ordering, ensuring everything is packed hot and ready on schedule.",
      icon: <Utensils size={24} className="text-dark" />
    },
    {
      title: "Self-Pickup at Store",
      description: "Direct in-store pickup only. Swing by Gip's Kitchen in Bulan to grab your freshly packed meal over the counter with zero waiting line.",
      icon: <Store size={24} className="text-dark" />
    }
  ];

  const pickupSteps = [
    {
      step: "01",
      title: "Browse & Order Online",
      description: "Check dish availability in real-time, customize your favorites, and place your pickup order from anywhere in Bulan.",
      icon: <ShoppingBag size={18} />,
      image: IMAGES.ABOUT_KITCHEN
    },
    {
      step: "02",
      title: "Fast Payment & Confirmation",
      description: "Pay quickly via GCash or settle your bill over the counter upon pickup. Track your order status in your personal bill dashboard.",
      icon: <CheckCircle2 size={18} />,
      image: IMAGES.INNOVATION_IMG
    },
    {
      step: "03",
      title: "Pick Up at Gip's Counter",
      description: "Head to our physical store, give your order name or ID, and pick up your hot, freshly packed meal ready to take home or enjoy.",
      icon: <Store size={18} />,
      image: IMAGES.ABOUT_LOUNGE
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Mission & Online Pickup Vision */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 bg-gray-200 text-dark px-3 py-1 rounded text-xs font-bold uppercase tracking-wider mb-4 border border-gray-300">
            <Sparkles size={14} />
            <span>Store Pickup System</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-dark mb-4 tracking-tight">
            Order Ahead. <br />
            <span className="text-primary">Pick Up Fresh at Gip's.</span>
          </h1>
          <p className="text-gray-600 text-sm md:text-base leading-relaxed font-medium">
            Skip the line! Order your favorite sizzling dishes and drinks ahead of time from anywhere, then pick up your order freshly packed and hot at our Bulan kitchen counter.
          </p>
        </div>

        {/* Pickup Pillars Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {pickupPillars.map((pillar, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-dark transition-colors"
            >
              <div className="bg-gray-100 w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center mb-4">
                {pillar.icon}
              </div>
              <h3 className="text-base font-bold text-dark mb-2">{pillar.title}</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">{pillar.description}</p>
            </div>
          ))}
        </div>

        {/* How Self-Pickup Works */}
        <div className="space-y-8">
          <div className="text-center">
            <h2 className="text-2xl md:text-3xl font-black text-dark tracking-tight">How Store Pickup Works</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Simple, seamless ordering designed for busy customers on the go.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pickupSteps.map((step, index) => (
              <div
                key={index}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="relative h-48 bg-gray-100">
                  <img 
                    src={step.image} 
                    alt={step.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 bg-dark text-white p-2 rounded-lg">
                    {step.icon}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-dark text-white px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                    STEP {step.step}
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-bold text-dark mb-1.5">{step.title}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed font-medium">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Meet the Kitchen Crew */}
        <div className="bg-white rounded-xl border border-gray-200 p-8 md:p-12">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-dark text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider mb-4">
                <Store size={14} />
                <span>Direct Store Pickup</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-dark mb-4 tracking-tight">Prepared Fresh by our Kitchen Crew</h2>
              <p className="text-xs md:text-sm text-gray-600 leading-relaxed mb-6 font-medium">
                Our kitchen team personally manages and prepares every online takeout order with precision. When you arrive at Gip's Kitchen, your food is hot, packaged securely, and ready for you to pick up at the counter.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3.5 p-3.5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-10 h-10 rounded-lg bg-dark text-white flex items-center justify-center font-bold text-xs">GK</div>
                  <div>
                    <p className="font-bold text-dark text-xs">Gip's Kitchen Counter Pickup</p>
                    <p className="text-[11px] text-gray-500 font-medium">Order ahead & pick up your own food in Bulan</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src={IMAGES.ABOUT_TEAM_1} 
                alt="Chef" 
                className="rounded-lg border border-gray-200 aspect-[4/5] object-cover"
                referrerPolicy="no-referrer"
              />
              <img 
                src={IMAGES.ABOUT_TEAM_2} 
                alt="Kitchen Crew" 
                className="rounded-lg border border-gray-200 aspect-[4/5] object-cover mt-6"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Commitment Section */}
        <div className="bg-dark rounded-xl p-8 md:p-12 text-white border border-gray-900">
          <div className="max-w-2xl">
            <h2 className="text-2xl md:text-3xl font-black mb-3">Our Freshness Guarantee</h2>
            <p className="text-gray-300 text-xs md:text-sm mb-6 leading-relaxed">
              We never pre-cook or leave dishes sitting out. Your takeout order is prepared upon timing so it stays steaming hot and crispy when you arrive for pickup at our store.
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs">GK</div>
              <div>
                <p className="font-bold text-xs">The Gip's Kitchen Team</p>
                <p className="text-[11px] text-gray-400">Excellence in every serve</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location, Contact & Hours Section */}
        <footer className="bg-dark text-white rounded-xl p-8 md:p-12 border border-gray-900">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 text-xl font-black tracking-tight mb-4">
                <div className="bg-primary p-1 rounded overflow-hidden w-8 h-8 flex items-center justify-center">
                  <img src={IMAGES.LOGO} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <span>GIP'S <span className="text-primary">KITCHEN</span></span>
              </Link>
              <p className="text-gray-400 text-xs max-w-md leading-relaxed">
                Bulan's favorite spot for sizzling sisig, cold drinks, and great vibes. Order online and pick up your meal at our store.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-white">Pickup Location</h4>
              <ul className="space-y-2.5 text-gray-400 text-xs">
                <li className="flex items-start gap-2.5">
                  <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                  <span>Bulan, Sorsogon, Philippines</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock size={15} className="text-primary shrink-0" />
                  <span>Open Daily: 2:00 PM – 1:00 AM</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone size={15} className="text-primary shrink-0" />
                  <span>+63 9612 420 555</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider mb-4 text-white">Follow Us</h4>
              <div className="flex gap-2">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-primary transition-colors">
                  <Facebook size={16} className="text-gray-300 hover:text-white" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-white/10 text-center text-gray-500 text-xs font-medium">
            <p>© {new Date().getFullYear()} Gip's Kitchen. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default About;
