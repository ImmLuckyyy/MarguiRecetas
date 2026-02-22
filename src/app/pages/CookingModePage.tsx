import React, { useState, useEffect } from 'react';
import { useRecipes, Step } from '../contexts/RecipesContext';
import { X, ChevronLeft, ChevronRight, Timer, Play, Pause, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CookingModePageProps {
  recipeId: string;
  onClose: () => void;
}

export function CookingModePage({ recipeId, onClose }: CookingModePageProps) {
  const { recipes } = useRecipes();
  const recipe = recipes.find(r => r.id === recipeId);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  
  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerFinished, setTimerFinished] = useState(false);

  useEffect(() => {
    // Prevent scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timerSeconds !== null && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev === null || prev <= 0) {
            setIsTimerRunning(false);
            setTimerFinished(true);
            // Vibrate if supported
            if ('vibrate' in navigator) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  if (!recipe) {
    return null;
  }

  const currentStep = recipe.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / recipe.steps.length) * 100;

  const handleNext = () => {
    if (currentStepIndex < recipe.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setTimerSeconds(null);
      setIsTimerRunning(false);
      setTimerFinished(false);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setTimerSeconds(null);
      setIsTimerRunning(false);
      setTimerFinished(false);
    }
  };

  const handleToggleComplete = () => {
    const newCompleted = new Set(completedSteps);
    if (completedSteps.has(currentStepIndex)) {
      newCompleted.delete(currentStepIndex);
    } else {
      newCompleted.add(currentStepIndex);
    }
    setCompletedSteps(newCompleted);
  };

  const startTimer = (minutes: number) => {
    setTimerSeconds(minutes * 60);
    setIsTimerRunning(true);
    setTimerFinished(false);
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    if (currentStep.timerMinutes) {
      setTimerSeconds(currentStep.timerMinutes * 60);
      setIsTimerRunning(false);
      setTimerFinished(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompleted = completedSteps.has(currentStepIndex);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center text-gray-900"
          >
            <X size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 flex-1 text-center mx-4 truncate">
            {recipe.name}
          </h2>
          <div className="w-10" />
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full bg-blue-500"
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-2">
          Paso {currentStepIndex + 1} de {recipe.steps.length}
        </p>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.2 }}
            className="max-w-2xl mx-auto"
          >
            {/* Step number */}
            <div className="flex items-center justify-center mb-8">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold transition-colors ${
                isCompleted ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {isCompleted ? <Check size={32} strokeWidth={3} /> : currentStep.order}
              </div>
            </div>

            {/* Step description */}
            <p className="text-2xl sm:text-3xl leading-relaxed text-gray-900 text-center mb-8 font-medium">
              {currentStep.description}
            </p>

            {/* Timer section */}
            {currentStep.timerMinutes && (
              <div className="bg-gray-50 rounded-3xl p-8 mb-8">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">Temporizador sugerido</p>
                  
                  {timerSeconds === null ? (
                    <button
                      onClick={() => startTimer(currentStep.timerMinutes!)}
                      className="mx-auto flex items-center justify-center gap-3 px-8 py-4 bg-blue-500 text-white rounded-2xl font-medium text-lg active:bg-blue-600 transition-colors"
                    >
                      <Timer size={24} />
                      <span>{currentStep.timerMinutes} minutos</span>
                    </button>
                  ) : (
                    <div>
                      <div className={`text-6xl sm:text-7xl font-bold mb-6 ${
                        timerFinished ? 'text-red-500 animate-pulse' : 'text-gray-900'
                      }`}>
                        {formatTime(timerSeconds)}
                      </div>
                      
                      {timerFinished && (
                        <motion.p
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="text-xl font-semibold text-red-500 mb-4"
                        >
                          ¡Tiempo terminado! ⏰
                        </motion.p>
                      )}
                      
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={toggleTimer}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-xl font-medium active:bg-blue-600 transition-colors"
                        >
                          {isTimerRunning ? (
                            <>
                              <Pause size={20} />
                              <span>Pausar</span>
                            </>
                          ) : (
                            <>
                              <Play size={20} />
                              <span>Iniciar</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={resetTimer}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-900 rounded-xl font-medium active:bg-gray-300 transition-colors"
                        >
                          <RotateCcw size={20} />
                          <span>Reiniciar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Complete step button */}
            <button
              onClick={handleToggleComplete}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-colors ${
                isCompleted
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-100 text-gray-900 active:bg-gray-200'
              }`}
            >
              {isCompleted ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={24} strokeWidth={2.5} />
                  Completado
                </span>
              ) : (
                'Marcar como completado'
              )}
            </button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 py-4 safe-area-bottom">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-medium transition-colors ${
              currentStepIndex === 0
                ? 'bg-gray-100 text-gray-400'
                : 'bg-gray-100 text-gray-900 active:bg-gray-200'
            }`}
          >
            <ChevronLeft size={20} />
            <span className="hidden sm:inline">Anterior</span>
          </button>

          <div className="flex-1 text-center">
            <p className="text-sm text-gray-600">
              {completedSteps.size} de {recipe.steps.length} completados
            </p>
          </div>

          <button
            onClick={handleNext}
            disabled={currentStepIndex === recipe.steps.length - 1}
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-medium transition-colors ${
              currentStepIndex === recipe.steps.length - 1
                ? 'bg-gray-100 text-gray-400'
                : 'bg-blue-500 text-white active:bg-blue-600'
            }`}
          >
            <span className="hidden sm:inline">Siguiente</span>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
