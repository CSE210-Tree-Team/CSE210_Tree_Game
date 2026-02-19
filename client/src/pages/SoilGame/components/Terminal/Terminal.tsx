import { useState, useEffect, useRef } from 'react';
import styles from './Terminal.module.css';

interface TerminalProps {
  logs: string[];
  onCommand: (cmd: string) => void;
}

export function Terminal({ logs, onCommand }: TerminalProps) {
  const [input, setInput] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

// scrolling to the botoom auto
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = input.trim();
    if (!cleanInput) return;
    
    onCommand(cleanInput);
    setInput("");
  };

  // Logic to determine CSS class based on the log content
  const getLineClass = (line: string) => {
    if (line.startsWith("> ")) return styles.commandLine;
    if (line.includes("Location:")) return styles.locationLine;
    if (line.includes("Collected") || line.includes("Submitted")) return styles.successLine;
    return styles.logLine;
  };

  return (
    <div className={styles.terminalContainer}>
      <div ref={logRef} className={styles.logArea}>
        {logs.map((line, i) => (
          <div key={i} className={getLineClass(line)}>
            {line}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className={styles.inputArea}>
        <span className={styles.prompt}>{">"}</span>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter command..."
          autoFocus
          className={styles.inputField}
        />
      </form>
    </div>
  );
}