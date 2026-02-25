export function CompleteScreen({ onRestart }: { onRestart: () => void }) {
  return (
    <div style={{padding: '50px', color: 'white'}}>
      <h1>GAME COMPLETE</h1>
      <button onClick={onRestart}>Play Again</button>
    </div>
  );
}