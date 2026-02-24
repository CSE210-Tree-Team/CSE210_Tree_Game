import React from 'react';

interface CompleteScreenProps {
  onComplete: () => Promise<any>;
}

export const CompleteScreen: React.FC<CompleteScreenProps> = ({ onComplete }) => {
  const handleComplete = async () => {
    const result = await onComplete();
    console.log('Game completed:', result);
    alert('Game complete! Soil fertility restored!');
  };

  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🎉 Quest Complete!</h1>
      <p>You have successfully restored the soil fertility!</p>
      <p>All molecules have been created.</p>
      <button onClick={handleComplete} style={{ padding: '10px 20px', fontSize: '16px' }}>
        Submit & Return
      </button>
    </div>
  );
};
