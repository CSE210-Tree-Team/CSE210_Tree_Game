import React from 'react';

interface TitleScreenProps {
  onStart: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({ onStart }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🌱 Soil Game</h1>
      <p>Collect elements to create molecules and restore soil fertility!</p>
      <button onClick={onStart} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Start Game
      </button>
    </div>
  );
};
