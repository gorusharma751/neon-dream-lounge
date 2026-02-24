import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import MobileHeader from '@/components/MobileHeader';
import BottomNav from '@/components/BottomNav';
import GamesTab from '@/components/tabs/GamesTab';
import FoodTab from '@/components/tabs/FoodTab';
import CartTab from '@/components/tabs/CartTab';
import ProfileTab from '@/components/tabs/ProfileTab';

const Index = () => {
  const [activeTab, setActiveTab] = useState('games');

  const renderTab = () => {
    switch (activeTab) {
      case 'games': return <GamesTab />;
      case 'food': return <FoodTab />;
      case 'cart': return <CartTab />;
      case 'profile': return <ProfileTab />;
      default: return <GamesTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MobileHeader />
      <main className="pt-16 pb-20">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderTab()}
        </motion.div>
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
};

export default Index;
