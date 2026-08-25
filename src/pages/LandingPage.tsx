import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Utensils, Phone, ArrowRight, Facebook, Clock, MapPin } from 'lucide-react';
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
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden bg-white py-16">
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
    </div>
  );
};

export default LandingPage;

