import { motion } from 'motion/react';
import { ShoppingBag, Store, Clock, Utensils, Coffee, MapPin, Phone, Facebook, Sparkles, CheckCircle2 } from 'lucide-react';
import { IMAGES } from '../constants/images';
import { Link } from 'react-router-dom';

const About = () => {
  const pickupPillars = [
    {
      title: "Order Ahead From Anywhere",
      description: "Browse our full sizzling menu online from your phone or laptop. Choose your favorites and submit your order in seconds before heading over.",
      icon: <ShoppingBag size={32} className="text-primary" />
    },
    {
      title: "Fresh Kitchen Preparation",
      description: "Our kitchen crew prepares your sizzling dishes with fresh ingredients upon ordering, ensuring everything is packed hot and ready on schedule.",
      icon: <Utensils size={32} className="text-primary" />
    },
    {
      title: "Self-Pickup at Store",
      description: "Direct in-store pickup only. Swing by Gip's Kitchen in Bulan to grab your freshly packed meal over the counter with zero waiting line.",
      icon: <Store size={32} className="text-primary" />
    }
  ];

  const pickupSteps = [
    {
      step: "01",
      title: "Browse & Order Online",
      description: "Check dish availability in real-time, customize your favorites, and place your pickup order from anywhere in Bulan.",
      icon: <ShoppingBag size={24} />,
      image: IMAGES.ABOUT_KITCHEN
    },
    {
      step: "02",
      title: "Fast Payment & Confirmation",
      description: "Pay quickly via GCash or settle your bill over the counter upon pickup. Track your order status in your personal bill dashboard.",
      icon: <CheckCircle2 size={24} />,
      image: IMAGES.INNOVATION_IMG
    },
    {
      step: "03",
      title: "Pick Up at Gip's Counter",
      description: "Head to our physical store, give your order name or ID, and pick up your hot, freshly packed meal ready to take home or enjoy.",
      icon: <Store size={24} />,
      image: IMAGES.ABOUT_LOUNGE
    }
  ];

  return (
    <div className="min-h-screen bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Mission & Online Pickup Vision */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6"
          >
            <Sparkles size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Store Pickup System</span>
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-bold text-dark mb-8 tracking-tighter leading-tight">
            Order Ahead. <br />
            <span className="text-primary italic font-serif">Pick Up Fresh at Gip's.</span>
          </h1>
          <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed font-medium">
            "Skip the line! Order your favorite sizzling dishes and drinks ahead of time from anywhere, then pick up your order freshly packed and hot at our Bulan kitchen counter."
          </p>
        </div>

        {/* Pickup Pillars Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {pickupPillars.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
            >
              <div className="bg-gray-50 w-20 h-20 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-primary/10 transition-colors">
                {pillar.icon}
              </div>
              <h3 className="text-2xl font-bold text-dark mb-4">{pillar.title}</h3>
              <p className="text-gray-500 leading-relaxed font-medium">{pillar.description}</p>
            </motion.div>
          ))}
        </div>

        {/* How Self-Pickup Works */}
        <div className="space-y-12 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark tracking-tight">How Store Pickup Works</h2>
            <p className="text-gray-500 font-medium mt-2">Simple, seamless ordering designed for busy customers on the go.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {pickupSteps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-64 rounded-[2rem] overflow-hidden mb-6 shadow-sm">
                  <img 
                    src={step.image} 
                    alt={step.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-dark shadow-lg">
                    {step.icon}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-dark/80 backdrop-blur-sm px-3.5 py-1.5 rounded-full text-white font-black text-xs tracking-widest">
                    STEP {step.step}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-dark mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Meet the Kitchen Crew (No Delivery Staff) */}
        <div className="bg-gray-50 rounded-[3rem] p-12 md:p-20 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-dark text-white px-4 py-2 rounded-full mb-8">
                <Store size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest">Direct Store Pickup</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-dark mb-8 tracking-tight">Prepared Fresh by our Kitchen Crew</h2>
              <p className="text-xl text-gray-500 leading-relaxed mb-8 font-medium">
                Our kitchen team personally manages and prepares every online takeout order with precision. When you arrive at Gip's Kitchen, your food is hot, packaged securely, and ready for you to pick up at the counter.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">GK</div>
                  <div>
                    <p className="font-bold text-dark">Gip's Kitchen Counter Pickup</p>
                    <p className="text-sm text-gray-400">Order ahead & pick up your own food in Bulan</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <img 
                src={IMAGES.ABOUT_TEAM_1} 
                alt="Chef" 
                className="rounded-3xl shadow-lg aspect-[4/5] object-cover"
                referrerPolicy="no-referrer"
              />
              <img 
                src={IMAGES.ABOUT_TEAM_2} 
                alt="Kitchen Crew" 
                className="rounded-3xl shadow-lg aspect-[4/5] object-cover mt-8"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Commitment Section */}
        <div className="bg-dark rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative mb-24">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-bold mb-8">Our Freshness Guarantee</h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              We never pre-cook or leave dishes sitting out. Your takeout order is prepared upon timing so it stays steaming hot and crispy when you arrive for pickup at our store.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center font-bold">GK</div>
              <div>
                <p className="font-bold">The Gip's Kitchen Team</p>
                <p className="text-sm text-gray-400">Excellence in every serve</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 hidden lg:block">
            <img 
              src={IMAGES.ABOUT_COMMITMENT} 
              alt="Kitchen" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        {/* Location, Contact & Hours Section */}
        <footer className="bg-dark text-white rounded-[3rem] p-10 md:p-16">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 text-3xl font-bold tracking-tighter mb-6">
                <div className="bg-primary p-1.5 rounded-full overflow-hidden w-10 h-10 flex items-center justify-center">
                  <img src={IMAGES.LOGO} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <span>GIP'S <span className="text-primary">KITCHEN</span></span>
              </Link>
              <p className="text-gray-400 text-base max-w-md leading-relaxed">
                Bulan's favorite spot for sizzling sisig, cold drinks, and great vibes. Order online and pick up your meal at our store.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">Pickup Location</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                  <span>Bulan, Sorsogon, Philippines</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock size={18} className="text-primary shrink-0" />
                  <span>Open Daily: 2:00 PM – 1:00 AM</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={18} className="text-primary shrink-0" />
                  <span>+63 9612 420 555</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-bold mb-6">Follow Us</h4>
              <div className="flex gap-4">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-11 h-11 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-all group">
                  <Facebook size={20} className="text-gray-400 group-hover:text-white" />
                </a>
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-white/10 text-center text-gray-500 text-xs font-medium">
            <p>© {new Date().getFullYear()} Gip's Kitchen. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default About;

