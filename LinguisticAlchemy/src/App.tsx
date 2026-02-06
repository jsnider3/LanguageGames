import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book, Eraser, Github, Sparkles } from 'lucide-react';
import { type Word, INITIAL_WORDS, RECIPES, ALL_WORDS } from './data';

interface WorkspaceWord extends Word {
  instanceId: string;
  x: number;
  y: number;
}

const App: React.FC = () => {
  const [discovered, setDiscovered] = useState<string[]>(() => {
    const saved = localStorage.getItem('discovered-words');
    return saved ? JSON.parse(saved) : INITIAL_WORDS.map(w => w.id);
  });

  const [workspace, setWorkspace] = useState<WorkspaceWord[]>([]);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('discovered-words', JSON.stringify(discovered));
  }, [discovered]);

  const addToWorkspace = (wordId: string) => {
    const word = ALL_WORDS[wordId];
    if (!word) return;

    const newWord: WorkspaceWord = {
      ...word,
      instanceId: Math.random().toString(36).substr(2, 9),
      x: Math.random() * 100 + 50,
      y: Math.random() * 100 + 50,
    };
    setWorkspace([...workspace, newWord]);
  };

  const clearWorkspace = () => setWorkspace([]);

  const handleDragEnd = (instanceId: string, info: any) => {
    const draggedIdx = workspace.findIndex(w => w.instanceId === instanceId);
    if (draggedIdx === -1) return;

    const dragged = workspace[draggedIdx];
    const newX = dragged.x + info.offset.x;
    const newY = dragged.y + info.offset.y;

    // Check for collisions
    let combined = false;
    const newWorkspace = [...workspace];
    
    for (let i = 0; i < newWorkspace.length; i++) {
      if (newWorkspace[i].instanceId === instanceId) continue;

      const other = newWorkspace[i];
      const dx = other.x - newX;
      const dy = other.y - newY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 60) {
        const recipeKey = `${dragged.id}+${other.id}`;
        const resultId = RECIPES[recipeKey];

        if (resultId) {
          const resultWord = ALL_WORDS[resultId];
          // Remove both
          const filtered = newWorkspace.filter(w => 
            w.instanceId !== instanceId && w.instanceId !== other.instanceId
          );
          
          // Add result
          const resultInstance: WorkspaceWord = {
            ...resultWord,
            instanceId: Math.random().toString(36).substr(2, 9),
            x: other.x,
            y: other.y,
          };
          
          setWorkspace([...filtered, resultInstance]);
          
          if (!discovered.includes(resultId)) {
            setDiscovered([...discovered, resultId]);
          }
          combined = true;
          break;
        }
      }
    }

    if (!combined) {
      const updated = [...workspace];
      updated[draggedIdx] = { ...dragged, x: newX, y: newY };
      setWorkspace(updated);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-slate-800/50 border-r border-slate-700 p-4 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center gap-2 mb-2">
          <Book className="text-cyan-400" size={24} />
          <h1 className="text-xl font-bold tracking-tight">Lexicon</h1>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {discovered.map(id => {
            const word = ALL_WORDS[id];
            return (
              <button
                key={id}
                onClick={() => addToWorkspace(id)}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors border border-slate-600 hover:border-cyan-500/50 group"
              >
                <span>{word.emoji}</span>
                <span className="text-sm font-medium">{word.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace */}
      <div 
        ref={workspaceRef}
        className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900"
      >
        <div className="absolute top-6 left-6 flex items-center gap-2 text-slate-400">
          <Sparkles size={18} />
          <span className="text-sm font-medium uppercase tracking-widest">Alchemist's Workshop</span>
        </div>

        <button
          onClick={clearWorkspace}
          className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-red-900/30 text-slate-400 hover:text-red-400 rounded-full transition-all border border-slate-700 hover:border-red-500/50"
          title="Clear Workspace"
        >
          <Eraser size={20} />
        </button>

        <AnimatePresence>
          {workspace.map((word) => (
            <motion.div
              key={word.instanceId}
              drag
              dragMomentum={false}
              onDragEnd={(_, info) => handleDragEnd(word.instanceId, info)}
              initial={{ scale: 0, opacity: 0, x: word.x, y: word.y }}
              animate={{ scale: 1, opacity: 1, x: word.x, y: word.y }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute cursor-grab active:cursor-grabbing select-none"
              style={{ x: word.x, y: word.y }}
            >
              <div className="bg-slate-800/80 backdrop-blur-md border-2 border-slate-600 px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 min-w-[100px] hover:border-cyan-400/50 transition-colors">
                <span className="text-2xl">{word.emoji}</span>
                <span className="font-bold tracking-wide">{word.label}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {workspace.length === 0 && (
          <div className="absolute inset-0 flex flex-center justify-center items-center pointer-events-none">
            <p className="text-slate-500 text-lg italic opacity-50">Select concepts from your Lexicon to begin...</p>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <a 
        href="https://github.com" 
        target="_blank" 
        className="absolute bottom-6 right-6 text-slate-500 hover:text-cyan-400 transition-colors"
      >
        <Github size={20} />
      </a>
    </div>
  );
};

export default App;