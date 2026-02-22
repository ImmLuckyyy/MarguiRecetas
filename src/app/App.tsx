import React, { useState, useEffect } from 'react';
import { RecipesProvider } from './contexts/RecipesContext';
import { TabNavigation } from './components/TabNavigation';
import { Onboarding } from './components/Onboarding';
import { RecipesPage } from './pages/RecipesPage';
import { SearchPage } from './pages/SearchPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { RecipeDetailPage } from './pages/RecipeDetailPage';
import { RecipeFormPage } from './pages/RecipeFormPage';
import { CookingModePage } from './pages/CookingModePage';
import { AnimatePresence, motion } from 'motion/react';
import { Toaster } from './components/ui/sonner';

type View = 'recipes' | 'search' | 'categories' | 'favorites' | 'shopping' | 'detail' | 'form' | 'cooking';

export default function App() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<View>('recipes');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
  const [cookingRecipeId, setCookingRecipeId] = useState<string | null>(null);

  useEffect(() => {
    const hasSeenOnboardingStorage = localStorage.getItem('hasSeenOnboarding');
    setHasSeenOnboarding(hasSeenOnboardingStorage === 'true');
  }, []);

  const handleRecipeClick = (id: string) => {
    setSelectedRecipeId(id);
    setActiveTab('detail');
  };

  const handleNewRecipe = () => {
    setEditingRecipeId(null);
    setActiveTab('form');
  };

  const handleEditRecipe = (id: string) => {
    setEditingRecipeId(id);
    setActiveTab('form');
  };

  const handleStartCooking = (id: string) => {
    setCookingRecipeId(id);
    setActiveTab('cooking');
  };

  const handleBackFromDetail = () => {
    setSelectedRecipeId(null);
    setActiveTab('recipes');
  };

  const handleBackFromForm = () => {
    setEditingRecipeId(null);
    if (selectedRecipeId) {
      setActiveTab('detail');
    } else {
      setActiveTab('recipes');
    }
  };

  const handleCloseCooking = () => {
    setCookingRecipeId(null);
    if (selectedRecipeId) {
      setActiveTab('detail');
    } else {
      setActiveTab('recipes');
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as View);
    setSelectedRecipeId(null);
    setEditingRecipeId(null);
  };

  if (!hasSeenOnboarding) {
    return <Onboarding onComplete={() => setHasSeenOnboarding(true)} />;
  }

  return (
    <RecipesProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Main content */}
        <AnimatePresence mode="wait">
          {activeTab === 'recipes' && (
            <motion.div
              key="recipes"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <RecipesPage
                onRecipeClick={handleRecipeClick}
                onNewRecipe={handleNewRecipe}
              />
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <SearchPage onRecipeClick={handleRecipeClick} />
            </motion.div>
          )}

          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <CategoriesPage onRecipeClick={handleRecipeClick} />
            </motion.div>
          )}

          {activeTab === 'favorites' && (
            <motion.div
              key="favorites"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <FavoritesPage onRecipeClick={handleRecipeClick} />
            </motion.div>
          )}

          {activeTab === 'shopping' && (
            <motion.div
              key="shopping"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <ShoppingListPage />
            </motion.div>
          )}

          {activeTab === 'detail' && selectedRecipeId && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <RecipeDetailPage
                recipeId={selectedRecipeId}
                onBack={handleBackFromDetail}
                onEdit={handleEditRecipe}
                onStartCooking={handleStartCooking}
              />
            </motion.div>
          )}

          {activeTab === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <RecipeFormPage
                recipeId={editingRecipeId || undefined}
                onBack={handleBackFromForm}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cooking mode - separate from AnimatePresence to overlay everything */}
        {activeTab === 'cooking' && cookingRecipeId && (
          <CookingModePage
            recipeId={cookingRecipeId}
            onClose={handleCloseCooking}
          />
        )}

        {/* Tab navigation - hidden in detail, form and cooking views */}
        {!['detail', 'form', 'cooking'].includes(activeTab) && (
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        )}
      </div>
      <Toaster position="top-center" />
    </RecipesProvider>
  );
}