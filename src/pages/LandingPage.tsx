import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Utensils, Music, Phone, ArrowRight, Truck, Coffee, Zap, Facebook, Instagram, Clock, MapPin } from 'lucide-react';
import { useContext, useEffect } from 'react';
import { IMAGES } from '../constants/images';
import { AuthContext } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden bg-white">
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.HERO_BG} 
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-10"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-8">
              <Zap size={16} />
              <span className="text-xs font-bold uppercase tracking-widest">Now Open in Bulan</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-8 tracking-tighter text-dark leading-[0.9]">
              Your Favorite <br />
              <span className="text-primary italic font-serif">Chill Spot</span> in Bulan.
            </h1>
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-gray-500 font-medium leading-relaxed">
              Home of the best Sizzling Sisig and the coldest drinks. Whether it’s lunch with the family or a night out with friends, we’ve got your table ready.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link 
                to="/menu" 
                className="bg-primary hover:bg-opacity-90 text-white px-10 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-primary/30 transform hover:-translate-y-1"
              >
                Browse Menu <Utensils size={20} />
              </Link>
              <Link 
                to="/about" 
                className="bg-transparent border-2 border-dark text-dark hover:bg-dark hover:text-white px-10 py-5 rounded-full font-bold text-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1"
              >
                Learn More <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Experience Categories */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Dine-in", icon: <Utensils size={32} />, desc: "Enjoy our cozy semi-outdoor seating." },
            { title: "Take-out", icon: <Truck size={32} />, desc: "Quick and easy pickup for your meals." },
            { title: "Videoke", icon: <Music size={32} />, desc: "Sing your heart out with friends." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              whileHover={{ y: -10 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-50 text-center group transition-all hover:shadow-xl"
            >
              <div className="w-20 h-20 bg-gray-50 text-dark rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary group-hover:text-white transition-all">
                {item.icon}
              </div>
              <h3 className="text-2xl font-bold mb-4 text-dark">{item.title}</h3>
              <p className="text-gray-500 font-medium">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Innovation Block */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="bg-white rounded-[3rem] p-12 md:p-20 shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-16">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 bg-dark text-white px-4 py-2 rounded-full mb-8">
                <Zap size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest">Innovation</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-dark mb-8 tracking-tight">Faster service, better experience.</h2>
              <p className="text-xl text-gray-500 leading-relaxed mb-10">
                We use a digital management system to ensure your orders are prepared with precision and served fresh. No more long waits or mixed-up orders.
              </p>
              <div className="flex items-center gap-4 text-primary font-bold">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRight size={24} />
                </div>
                <span>Modernizing the Bulan dining scene</span>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute -inset-4 bg-primary/10 rounded-[3rem] blur-2xl"></div>
              <img 
                src={IMAGES.INNOVATION_IMG} 
                alt="Digital System" 
                className="relative z-10 rounded-[2.5rem] shadow-2xl"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Gallery Preview */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-dark mb-6 tracking-tight">Eat. Drink. Enjoy.</h2>
            <p className="text-xl text-gray-500 font-medium">Take a look at what's waiting for you at our spot.</p>
          </div>
          <Link to="/gallery" className="bg-dark text-white px-8 py-4 rounded-full font-bold hover:bg-primary transition-all flex items-center gap-2">
            View Full Gallery <ArrowRight size={20} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="aspect-square rounded-3xl overflow-hidden shadow-sm">
            <img src={IMAGES.GALLERY_1} alt="Food" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
          <div className="aspect-square rounded-3xl overflow-hidden shadow-sm md:mt-12">
            <img src={IMAGES.GALLERY_2} alt="Vibe" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
          <div className="aspect-square rounded-3xl overflow-hidden shadow-sm">
            <img src={IMAGES.GALLERY_3} alt="Drink" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
          <div className="aspect-square rounded-3xl overflow-hidden shadow-sm md:mt-12">
            <img src={IMAGES.GALLERY_4} alt="Experience" className="w-full h-full object-cover hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 text-3xl font-bold tracking-tighter mb-8">
                <div className="bg-primary p-1.5 rounded-full overflow-hidden w-10 h-10 flex items-center justify-center">
                  <img src={IMAGES.LOGO} alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <span>GIP'S <span className="text-primary">KITCHEN</span></span>
              </Link>
              <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                Bulan's favorite spot for sizzling sisig, cold drinks, and great vibes. Join us for an unforgettable experience.
              </p>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-8">Visit Us</h4>
              <ul className="space-y-4 text-gray-400">
                <li className="flex items-start gap-3">
                  <MapPin size={20} className="text-primary shrink-0" />
                  <span>Bulan, Sorsogon, Philippines</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock size={20} className="text-primary shrink-0" />
                  <span>Open Daily: 2:00 PM – 1:00 AM</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone size={20} className="text-primary shrink-0" />
                  <span>+63 9612 420 555</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-bold mb-8">Follow Us</h4>
              <div className="flex gap-4">
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-primary transition-all group">
                  <Facebook size={24} className="text-gray-400 group-hover:text-white" />
                </a>
              </div>
              <p className="mt-6 text-sm text-gray-500 font-medium">Check our Facebook page for "Daily Specials."</p>
            </div>
          </div>
          <div className="pt-12 border-t border-white/10 text-center text-gray-500 text-sm font-medium">
            <p>© {new Date().getFullYear()} Gip's Kitchen. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

