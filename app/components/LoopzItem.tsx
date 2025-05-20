'use client';

import { MotionDiv } from '../lib/motion';
import { Loopz } from '../types';

interface LoopzItemProps {
  loopz: Loopz;
  onSelect: (loopz: Loopz) => void;
}

const LoopzItem: React.FC<LoopzItemProps> = ({ loopz, onSelect }) => {
  const progressPercentage = Math.round(
    ((loopz.completedSteps ?? 0) / (loopz.totalSteps ?? 1)) * 100,
  );

  return (
    <MotionDiv
      onClick={() => onSelect(loopz)}
      className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 cursor-pointer"
      whileHover={{ scale: 1.02, backgroundColor: 'rgba(0, 0, 0, 0.01)' }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="font-medium text-lg mb-2">{loopz.title}</h3>

      <div className="flex items-center">
        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
          <MotionDiv
            className="bg-black rounded-full h-2"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-sm text-gray-500 w-16 text-right">
          {loopz.completedSteps ?? 0} / {loopz.totalSteps ?? 0}
        </span>
      </div>
    </MotionDiv>
  );
};

export default LoopzItem;
