import { motion } from 'motion/react';
import { Users, Music, Truck, Heart, Zap, Utensils, Coffee, Star } from 'lucide-react';
import { useContext, useEffect } from 'react';
import { IMAGES } from '../constants/images';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  if (user) return null;

  const pillars = [
    {
      title: "Community Hub",
      description: "A go-to spot in Bulan for celebrations, barkada hangouts, and family dinners. We're more than a restaurant; we're where memories are made.",
      icon: <Users size={32} className="text-primary" />
    },
    {
      title: "Music & Entertainment",
      description: "Experience the vibrant Videoke culture and our signature 'chill' night-time atmosphere. Perfect for unwinding after a long day.",
      icon: <Music size={32} className="text-primary" />
    },
    {
      title: "Convenience",
      description: "Accessible wherever you are. We've partnered with Moonride and Lods delivery services to bring your favorites straight to your doorstep.",
      icon: <Truck size={32} className="text-primary" />
    }
  ];

  const features = [
    {
      title: "The Kitchen",
      description: "Where tradition meets modern cooking techniques. We honor local flavors while embracing innovation.",
      icon: <Utensils size={24} />,
      image: IMAGES.ABOUT_KITCHEN
    },
    {
      title: "The Lounge",
      description: "Designed for comfort, music, and long conversations. Our semi-outdoor space is the heart of the chill vibe.",
      icon: <Coffee size={24} />,
      image: IMAGES.ABOUT_LOUNGE
    },
    {
      title: "The Service",
      description: "Driven by a commitment to speed and customer satisfaction.",
      icon: <Zap size={24} />,
      image: IMAGES.INNOVATION_IMG
    }
  ];

  return (
    <div className="min-h-screen bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Mission & Vision */}
        <div className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6"
          >
            <Star size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Our Mission</span>
          </motion.div>
          <h1 className="text-4xl md:text-7xl font-bold text-dark mb-8 tracking-tighter leading-tight">
            Premier Dining. <br />
            <span className="text-primary italic font-serif">Modern Service.</span>
          </h1>
          <p className="text-gray-500 text-xl max-w-3xl mx-auto leading-relaxed font-medium">
            "Our mission is to provide Bulan with a premier dining experience that combines high-quality local flavors with a modern, tech-driven service."
          </p>
        </div>

        {/* Pillars Section */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {pillars.map((pillar, index) => (
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
              <p className="text-gray-500 leading-relaxed">{pillar.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Feature Descriptions */}
        <div className="space-y-12 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-dark tracking-tight">The Experience</h2>
            <p className="text-gray-500 font-medium mt-2">Every detail crafted for your enjoyment.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
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
                    src={feature.image} 
                    alt={feature.title} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-2xl text-dark shadow-lg">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-dark mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Meet the Team */}
        <div className="bg-gray-50 rounded-[3rem] p-12 md:p-20 mb-32">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-dark text-white px-4 py-2 rounded-full mb-8">
                <Users size={16} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest">Humanizing the Brand</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-dark mb-8 tracking-tight">Meet the Kitchen Crew</h2>
              <p className="text-xl text-gray-500 leading-relaxed mb-10 font-medium">
                Our team is the heart of Gip's Kitchen. From our skilled chefs to our attentive service staff, we are a family dedicated to making you feel at home.
              </p>
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">GK</div>
                  <div>
                    <p className="font-bold text-dark">The Gip's Kitchen Team</p>
                    <p className="text-sm text-gray-400">Serving Bulan since 2020</p>
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
                alt="Service" 
                className="rounded-3xl shadow-lg aspect-[4/5] object-cover mt-8"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>

        {/* Commitment Section */}
        <div className="bg-dark rounded-[3rem] p-12 md:p-20 text-white overflow-hidden relative">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl font-bold mb-8">Our Commitment</h2>
            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
              We are dedicated to maintaining the highest standards of food quality and service. Every dish that leaves our kitchen is prepared with precision and served fresh to ensure your experience is nothing short of perfect.
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
      </div>
    </div>
  );
};

export default About;

