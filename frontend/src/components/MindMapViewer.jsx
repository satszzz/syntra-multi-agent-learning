import React, { useState, useRef, useEffect } from 'react';
import { 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  Sparkles, 
  Layers, 
  Cpu, 
  Zap, 
  GitBranch, 
  Info, 
  CheckCircle2, 
  ChevronRight,
  Move,
  BookOpen,
  X
} from 'lucide-react';

export const MindMapViewer = ({ mindMap, topic, onSelectTopic }) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [activeNode, setActiveNode] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef(null);

  // Fallback fallback if mindMap is still loading
  const rootTitle = mindMap?.root || topic || "Knowledge Domain";
  const branches = mindMap?.branches || [
    {
      id: "b1",
      title: "Core Foundations",
      icon: "Layers",
      color: "#38bdf8",
      nodes: [
        { id: "n1", label: "Fundamental Concepts" },
        { id: "n2", label: "Architecture Rules" }
      ]
    },
    {
      id: "b2",
      title: "Key Formulas",
      icon: "Cpu",
      color: "#818cf8",
      nodes: [
        { id: "n3", label: "Calculations & Bounds" },
        { id: "n4", label: "State Transitions" }
      ]
    }
  ];

  const leftBranches = branches.slice(0, Math.ceil(branches.length / 2));
  const rightBranches = branches.slice(Math.ceil(branches.length / 2));

  // Mouse pan handlers
  const handleMouseDown = (e) => {
    // Only drag when clicking background, not buttons or nodes
    if (e.target.closest('button') || e.target.closest('.interactive-node')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch pan handlers for mobile/tablets
  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('.interactive-node')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ 
        x: e.touches[0].clientX - pan.x, 
        y: e.touches[0].clientY - pan.y 
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setActiveNode(null);
    setSelectedBranch(null);
  };

  const getBranchIcon = (iconName) => {
    switch ((iconName || '').toLowerCase()) {
      case 'layers': return <Layers className="w-3.5 h-3.5" />;
      case 'cpu': return <Cpu className="w-3.5 h-3.5" />;
      case 'zap': return <Zap className="w-3.5 h-3.5" />;
      case 'gitbranch': return <GitBranch className="w-3.5 h-3.5" />;
      default: return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className={`glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl space-y-6 relative overflow-hidden bg-dark-950/80 backdrop-blur-xl transition-all duration-300 ${
      isFullscreen ? 'fixed inset-4 z-50 overflow-auto bg-dark-950/95 border-brand-primary/40' : ''
    }`}>
      {/* Mind Map Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary/30 to-brand-accent/20 border border-brand-primary/40 flex items-center justify-center text-cyan-300 shadow-lg shadow-brand-primary/10">
            <Network className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Interactive Knowledge Mind Map
              </h3>
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                Touch & Pan Canvas
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Drag to pan • Click any node to inspect and explore subtopics.
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto bg-dark-900/90 p-1 rounded-xl border border-white/10 shadow-inner">
          <button
            onClick={() => setZoom(prev => Math.min(prev + 0.15, 1.5))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-all text-xs"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev - 0.15, 0.65))}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-all text-xs"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 transition-all text-xs"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="h-4 w-px bg-white/10 mx-0.5" />
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className={`p-1.5 rounded-lg transition-all text-xs ${
              isFullscreen ? 'bg-brand-primary text-white' : 'hover:bg-white/10 text-slate-300'
            }`}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <X className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Visual Canvas Area with Drag & Pan */}
      <div 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`relative min-h-[440px] rounded-2xl bg-gradient-to-b from-dark-950 via-dark-900 to-dark-950/90 border border-white/5 p-6 overflow-hidden select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Subtle Background Grid */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)`,
            backgroundSize: '24px 24px',
            transform: `translate(${pan.x % 24}px, ${pan.y % 24}px)`
          }}
        />

        {/* Pan & Zoom Transformed Canvas */}
        <div 
          className="transition-transform duration-75 ease-out flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 w-full py-8 min-w-[700px]"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
            transformOrigin: 'center center' 
          }}
        >
          {/* Left Wing Branches */}
          <div className="flex flex-col gap-6 w-5/12">
            {leftBranches.map((branch) => {
              const isSelected = selectedBranch === branch.id;
              return (
                <div 
                  key={branch.id} 
                  className={`p-4 rounded-2xl transition-all border duration-200 ${
                    isSelected 
                      ? 'bg-dark-800/95 border-brand-primary shadow-xl shadow-brand-primary/20 ring-1 ring-brand-primary/40' 
                      : 'bg-dark-900/80 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedBranch(isSelected ? null : branch.id)}
                >
                  <div className="flex items-center justify-between gap-2 mb-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span 
                        className="p-1.5 rounded-lg flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: `${branch.color}25`, color: branch.color, border: `1px solid ${branch.color}50` }}
                      >
                        {getBranchIcon(branch.icon)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{branch.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{branch.nodes.length} nodes</span>
                  </div>

                  {/* Sub-Nodes */}
                  <div className="space-y-2 pl-2 border-l border-white/10">
                    {branch.nodes.map((node) => {
                      const isActive = activeNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNode({ ...node, branchTitle: branch.title, color: branch.color });
                          }}
                          className={`interactive-node p-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-95 ${
                            isActive
                              ? 'bg-cyan-500/25 text-cyan-100 border border-cyan-400 font-semibold translate-x-1 shadow-lg shadow-cyan-500/20'
                              : 'bg-dark-950/60 text-slate-300 hover:text-white hover:bg-dark-950/90 border border-white/5 hover:border-white/15'
                          }`}
                        >
                          <span className="truncate">{node.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Central Root Core Node */}
          <div className="relative flex-shrink-0 z-10 my-4 md:my-0">
            {/* Glowing Halo */}
            <div className="absolute -inset-6 bg-gradient-to-r from-brand-primary via-indigo-500 to-brand-accent rounded-full blur-2xl opacity-40 animate-pulse pointer-events-none" />
            
            <div className="relative p-6 rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-950 border-2 border-brand-primary/70 shadow-2xl text-center max-w-[240px] ring-2 ring-brand-primary/20">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary/25 border border-brand-primary/60 text-cyan-300 mx-auto flex items-center justify-center mb-3 shadow-inner">
                <Network className="w-6 h-6 animate-pulse" />
              </div>
              <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase font-semibold">
                Central Pillar
              </span>
              <h3 className="text-sm font-extrabold text-white mt-1 leading-snug">
                {rootTitle}
              </h3>
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>{branches.reduce((acc, b) => acc + (b.nodes?.length || 0), 0)} Linked Sub-Concepts</span>
              </div>
            </div>
          </div>

          {/* Right Wing Branches */}
          <div className="flex flex-col gap-6 w-5/12">
            {rightBranches.map((branch) => {
              const isSelected = selectedBranch === branch.id;
              return (
                <div 
                  key={branch.id} 
                  className={`p-4 rounded-2xl transition-all border duration-200 ${
                    isSelected 
                      ? 'bg-dark-800/95 border-brand-accent shadow-xl shadow-brand-accent/20 ring-1 ring-brand-accent/40' 
                      : 'bg-dark-900/80 border-white/10 hover:border-white/20'
                  }`}
                  onClick={() => setSelectedBranch(isSelected ? null : branch.id)}
                >
                  <div className="flex items-center justify-between gap-2 mb-3 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <span 
                        className="p-1.5 rounded-lg flex items-center justify-center text-white text-xs"
                        style={{ backgroundColor: `${branch.color}25`, color: branch.color, border: `1px solid ${branch.color}50` }}
                      >
                        {getBranchIcon(branch.icon)}
                      </span>
                      <h4 className="text-xs font-bold text-slate-200">{branch.title}</h4>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">{branch.nodes.length} nodes</span>
                  </div>

                  {/* Sub-Nodes */}
                  <div className="space-y-2 pl-2 border-l border-white/10">
                    {branch.nodes.map((node) => {
                      const isActive = activeNode?.id === node.id;
                      return (
                        <div
                          key={node.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveNode({ ...node, branchTitle: branch.title, color: branch.color });
                          }}
                          className={`interactive-node p-2.5 rounded-xl text-xs transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-95 ${
                            isActive
                              ? 'bg-indigo-500/25 text-indigo-100 border border-indigo-400 font-semibold translate-x-1 shadow-lg shadow-indigo-500/20'
                              : 'bg-dark-950/60 text-slate-300 hover:text-white hover:bg-dark-950/90 border border-white/5 hover:border-white/15'
                          }`}
                        >
                          <span className="truncate">{node.label}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-50 flex-shrink-0" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Drag Helper Hint */}
        <div className="absolute bottom-3 left-4 text-[10px] text-slate-500 font-mono flex items-center gap-1 pointer-events-none">
          <Move className="w-3 h-3" />
          <span>Click & drag to pan canvas</span>
        </div>
      </div>

      {/* Active Node Telemetry & Study Launcher */}
      {activeNode && (
        <div className="p-4 rounded-2xl bg-dark-900/90 border border-brand-primary/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-xl">
          <div className="flex items-start sm:items-center gap-3">
            <div 
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-md"
              style={{ backgroundColor: `${activeNode.color}30`, border: `1px solid ${activeNode.color}` }}
            >
              <Info className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase text-slate-400">{activeNode.branchTitle}</span>
                <span className="text-[10px] text-cyan-400 font-semibold">• Active Node</span>
              </div>
              <h5 className="text-sm font-bold text-white mt-0.5">{activeNode.label}</h5>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {onSelectTopic && (
              <button
                onClick={() => onSelectTopic(activeNode.label)}
                className="px-4 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary/90 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-lg shadow-brand-primary/20"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Deep Dive Lesson</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setActiveNode(null)}
              className="px-3 py-2 rounded-xl bg-dark-800 hover:bg-dark-700 text-slate-400 hover:text-white text-xs transition-all border border-white/5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
