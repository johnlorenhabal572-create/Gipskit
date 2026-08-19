import { motion } from 'motion/react';
import { Image as ImageIcon, Utensils, Music, Coffee } from 'lucide-react';
import { useContext, useEffect } from 'react';
import { IMAGES } from '../constants/images';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Gallery = () => {
  const { user } = useContext(AuthContext) as any;
  const navigate = useNavigate();

  const categories = [
    {
      id: 'plates',
      title: 'The Plates',
      description: 'High-quality close-ups of our Sizzling Sisig and other food to enjoy.',
      icon: <Utensils size={24} />,
      images: [
        { url: IMAGES.GALLERY_1, alt: 'Sizzling Sisig'},
        { url: IMAGES.GALLERY_2, alt: 'Chicken Inasal'},
        { url: IMAGES.GALLERY_3, alt: 'Burgers and Fries'},
        { url: IMAGES.GALLERY_4, alt: 'Lumpiang Shanghai'},
      ]
    },
    {
      id: 'vibe',
      title: 'The Vibe',
      description: 'Our outdoor seating, Billiard setup, and the night-time chill.',
      icon: <Music size={24} />,
      images: [
        { url: IMAGES.GALLERY_8, alt: 'Outdoor Seating' },
        { url: IMAGES.GALLERY_7, alt: 'Billiard Night' },
        { url: IMAGES.GALLERY_6, alt: 'Night Atmosphere' },
        { url: IMAGES.GALLERY_5, alt: 'Customer Joy' },
      ]
    },
    {
      id: 'pour',
      title: 'The Pour',
      description: 'Colorful frappes, bucket deals, and refreshing drinks.',
      icon: <Coffee size={24} />,
      images: [
        { url: IMAGES.GALLERY_9, alt: 'Mango Shake' },
        { url: IMAGES.GALLERY_10, alt: 'Bucket Deal' },
        { url: IMAGES.GALLERY_11, alt: 'Beer and Softdrinks' },
        { url: IMAGES.GALLERY_12, alt: 'Cocktail Tower' },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4"
          >
            <ImageIcon size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Gallery</span>
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-bold text-dark mb-4 tracking-tight">Eat, Drink, Enjoy</h1>
          <p className="text-gray-500 max-w-2xl mx-auto">Explore the flavors, the atmosphere, and the refreshing moments at Gip's Kitchen.</p>
        </div>

        <div className="space-y-24">
          {categories.map((category, catIdx) => (
            <section key={category.id}>
              <div className="flex items-center gap-4 mb-8">
                <div className="bg-dark text-white p-3 rounded-2xl">
                  {category.icon}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-dark">{category.title}</h2>
                  <p className="text-gray-500 text-sm">{category.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {category.images.map((image, imgIdx) => (
                  <motion.div
                    key={imgIdx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: imgIdx * 0.1 }}
                    className="group relative aspect-square overflow-hidden rounded-3xl bg-gray-100 shadow-sm hover:shadow-xl transition-all"
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                      <p className="text-white font-bold">{image.alt}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;
