import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Search, FolderOpen, Heart, ShoppingCart, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: ChefHat,
      title: 'Bienvenido a tu cocina digital',
      description: 'Organiza todas tus recetas favoritas en un solo lugar. Simple, rápido y pensado para cocinar.',
      color: 'from-orange-400 to-pink-500'
    },
    {
      icon: Search,
      title: 'Encuentra recetas al instante',
      description: 'Busca por nombre o por los ingredientes que tengas disponibles en casa.',
      color: 'from-blue-400 to-cyan-500'
    },
    {
      icon: Heart,
      title: 'Modo cocina optimizado',
      description: 'Pantalla limpia, pasos grandes y temporizadores integrados. Cocina sin distracciones.',
      color: 'from-purple-400 to-pink-500'
    },
    {
      icon: ShoppingCart,
      title: 'Lista de compra automática',
      description: 'Genera tu lista de compras con un toque. Nunca más olvidarás un ingrediente.',
      color: 'from-green-400 to-emerald-500'
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      localStorage.setItem('hasSeenOnboarding', 'true');
      onComplete();
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
              className={`w-32 h-32 mx-auto mb-8 rounded-full bg-gradient-to-br ${slide.color} flex items-center justify-center shadow-2xl`}
            >
              <Icon size={64} className="text-white" strokeWidth={1.5} />
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {slide.title}
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="px-8 pb-12 space-y-6">
        {/* Progress dots */}
        <div className="flex justify-center gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'w-8 bg-blue-500'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleNext}
            className="w-full py-4 bg-blue-500 text-white rounded-2xl font-semibold text-lg active:bg-blue-600 transition-colors flex items-center justify-center gap-2"
          >
            {currentSlide === slides.length - 1 ? '¡Comenzar!' : 'Siguiente'}
            <ChevronRight size={20} />
          </button>

          {currentSlide < slides.length - 1 && (
            <button
              onClick={handleSkip}
              className="w-full py-4 text-gray-600 font-medium"
            >
              Saltar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
