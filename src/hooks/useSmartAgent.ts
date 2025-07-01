
import { useState } from 'react';

export const useSmartAgent = () => {
  const [isActive, setIsActive] = useState(false);

  return {
    isActive,
    setIsActive
  };
};
