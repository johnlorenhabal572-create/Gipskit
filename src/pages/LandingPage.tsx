import { Link, useNavigate } from 'react-router-dom';
import { Utensils, ArrowRight } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-65px)] bg-white flex flex-col justify-center">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-md text-xs font-bold text-gray-600 mb-6 uppercase tracking-wider">
            <span>Official Gip's Kitchen Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tight text-dark leading-[1.05]">
            Your Favorite <br />
            <span className="text-primary">Chill Spot</span> in Bulan.
          </h1>

          <p className="text-base sm:text-lg md:text-xl mb-10 max-w-2xl mx-auto text-gray-600 font-normal leading-relaxed">
            Home of the best Sizzling Sisig and the coldest drinks. Order ahead online and pick up fresh and hot at your convenience.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <Link 
              to="/menu" 
              className="flex-1 bg-primary text-white hover:bg-primary/90 px-6 py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors border border-transparent active:translate-y-0.5"
            >
              <Utensils size={18} />
              <span>Browse Menu</span>
            </Link>
            <Link 
              to="/about" 
              className="flex-1 bg-white border border-gray-300 text-dark hover:bg-gray-50 px-6 py-3.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors active:translate-y-0.5"
            >
              <span>About Pickup</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;

