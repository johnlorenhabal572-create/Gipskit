import { motion } from 'motion/react';
import { Phone, MapPin, Clock, Facebook, Instagram, Mail } from 'lucide-react';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Contact = () => {
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  if (user) return null;

  const contactInfo = [
    {
      title: "Visit Us",
      details: "Bulan, Sorsogon, Philippines",
      sub: "Located at T-De Castro Street BRGY: Zone 8 near at moon theater beside Guillermo's Pizza formerly Paminggalan Disco.",
      icon: <MapPin size={24} className="text-primary" />
    },
    {
      title: "Call Us",
      details: "+63 9612 420 555",
      sub: "Available for inquiries",
      icon: <Phone size={24} className="text-primary" />
    },
    {
      title: "Opening Hours",
      details: "2:00 PM – 1:00 AM",
      sub: "Open Daily",
      icon: <Clock size={24} className="text-primary" />
    }
  ];

  return (
    <div className="min-h-screen bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-6xl font-bold text-dark mb-6 tracking-tight">Get in Touch</h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Have questions about our menu, reservations, or delivery? We're here to help you have the best experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {contactInfo.map((info, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 text-center hover:shadow-xl transition-all"
            >
              <div className="bg-gray-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {info.icon}
              </div>
              <h3 className="text-xl font-bold text-dark mb-2">{info.title}</h3>
              <p className="text-gray-800 font-bold mb-1">{info.details}</p>
              <p className="text-gray-400 text-sm font-medium">{info.sub}</p>
            </motion.div>
          ))}
        </div>

        <div className="bg-dark rounded-[3rem] p-8 md:p-16 text-white flex flex-col md:flex-row gap-12 items-center">
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Connect with us on Social Media</h2>
            <p className="text-gray-400 text-lg mb-8 leading-relaxed">
              Follow our Facebook page for "Daily Specials," upcoming events, and a look behind the scenes at Gip's Kitchen.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" className="bg-white/10 p-4 rounded-2xl hover:bg-primary transition-all">
                <Facebook size={28} />
              </a>
              <a href="mailto:hello@gipskitchen.com" className="bg-white/10 p-4 rounded-2xl hover:bg-primary transition-all">
                <Mail size={28} />
              </a>
            </div>
          </div>
          <div className="flex-1 w-full h-64 md:h-96 bg-gray-800 rounded-[2rem] overflow-hidden">
            {/* Placeholder for a map or a nice image of the location */}
            <img 
              src="public/images/Screenshot 2026-04-14 112749.png" 
              alt="Location" 
              className="w-full h-full object-cover opacity-50"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

