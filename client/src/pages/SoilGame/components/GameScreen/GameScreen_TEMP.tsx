import React from 'react';
import type { GameState } from '../../types/SoilGame_REP.type';

interface GameScreenProps {
  state: GameState;
  onCommand: (command: string) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ state, onCommand }) => {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = (e.target as HTMLInputElement).value;
      onCommand(input);
      (e.target as HTMLInputElement).value = '';
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h2>Game Board</h2>
      
      <div style={{ 
        border: '1px solid #ccc', 
        padding: '10px', 
        marginBottom: '10px',
        height: '200px',
        overflowY: 'auto',
        backgroundColor: '#f5f5f5'
      }}>
        <h3>Terminal Log:</h3>
        {state.terminalLog.map((line, idx) => (
          <div key={idx}>{line}</div>
        ))}
      </div>

      <div style={{ marginBottom: '10px' }}>
        <h3>Position: [{state.playerPosition.x}, {state.playerPosition.y}]</h3>
        <h3>Inventory:</h3>
        <ul>
          <li>Nitrogen: {state.inventory.Nitrogen}</li>
          <li>Hydrogen: {state.inventory.Hydrogen}</li>
          <li>Carbon: {state.inventory.Carbon}</li>
          <li>Oxygen: {state.inventory.Oxygen}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <h3>Quests: {state.questsCompleted}/{state.quests.length}</h3>
        <ul>
          {state.quests.map((q) => (
            <li key={q.id}>
              {q.moleculeName} ({q.moleculeFormula}): {q.completed ? '✓ Complete' : 'In Progress'}
            </li>
          ))}
        </ul>
      </div>

      <input
        type="text"
        placeholder="Enter command (w/a/s/d, collect, 1-4)"
        onKeyPress={handleKeyPress}
        style={{ padding: '8px', width: '300px' }}
      />
      <p style={{ fontSize: '12px', color: '#666' }}>w = up, a = left, s = down, d = right, collect = gather, 1-4 = submit to quest</p>
    </div>
  );
};
