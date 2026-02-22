import React from 'react';
import { ChefHat, Search, FolderOpen, Heart, ShoppingCart } from 'lucide-react';
import { motion } from 'motion/react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  const tabs = [
    { id: 'recipes', label: 'Recetas', icon: ChefHat },
    { id: 'search', label: 'Buscar', icon: Search },
    { id: 'categories', label: 'Categorías', icon: FolderOpen },
    { id: 'favorites', label: 'Favoritos', icon: Heart },
    { id: 'shopping', label: 'Compra', icon: ShoppingCart }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-50">
      <div className="flex justify-around items-center h-20 max-w-2xl mx-auto px-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center gap-1 min-w-[60px] py-2 relative"
            >
              <motion.div
                initial={false}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  color: isActive ? '#007AFF' : '#8E8E93'
                }}
                transition={{ duration: 0.2 }}
              >
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span
                className={`text-xs transition-colors ${
                  isActive ? 'text-[#007AFF] font-semibold' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#007AFF] rounded-full"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
