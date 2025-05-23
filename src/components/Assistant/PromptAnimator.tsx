
import React, { useState, useEffect } from 'react';

interface PromptAnimatorProps {
  text: string;
  speed?: number;
}

const PromptAnimator = ({ text, speed = 50 }: PromptAnimatorProps) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  
  useEffect(() => {
    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(interval);
      }
    }, speed);
    
    return () => clearInterval(interval);
  }, [text, speed]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="my-4">
      <p className="text-blue-600 text-lg font-mono">
        {displayedText}
        <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          |
        </span>
      </p>
    </div>
  );
};

export default PromptAnimator;
