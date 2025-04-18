'use client';

import { motion } from 'framer-motion';
import LoopzItem from './LoopzItem';
import { Loopz } from '../types';

interface LoopzListProps {
  loopzList: Loopz[];
  onSelectLoopz: (loopz: Loopz) => void;
}

const LoopzList: React.FC<LoopzListProps> = ({ loopzList, onSelectLoopz }) => {
  // Stagger animation for the list items
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  return (
    <motion.div 
      className="py-4 px-2 overflow-y-auto flex-1 mb-16" // mb-16 to account for the fixed chat input
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {loopzList.length === 0 ? (
        <motion.div 
          className="text-center py-10 text-gray-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p>No open loops yet. Share a thought below.</p>
          <p className="mt-2 text-sm">Your mind will be clearer soon.</p>
        </motion.div>
      ) : (
        loopzList.map(loopz => (
          <LoopzItem 
            key={loopz.id} 
            loopz={loopz} 
            onSelect={onSelectLoopz} 
          />
        ))
      )}
    </motion.div>
  );
};

export default LoopzList; 