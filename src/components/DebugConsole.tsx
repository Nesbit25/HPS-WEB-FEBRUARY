import React, { useState, useEffect } from 'react';
import { X, Terminal, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: 'log' | 'error' | 'warn' | 'info';
  data?: any;
}

export function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logId, setLogId] = useState(0);

  useEffect(() => {
    // Intercept console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (type: LogEntry['type'], args: any[]) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      const newLog: LogEntry = {
        id: logId,
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
        data: args.length === 1 && typeof args[0] === 'object' ? args[0] : undefined
      };

      setLogId(prev => prev + 1);
      setLogs(prev => [newLog, ...prev].slice(0, 100)); // Keep last 100 logs
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
    };
  }, [logId]);

  const clearLogs = () => {
    setLogs([]);
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'text-red-400';
      case 'warn': return 'text-yellow-400';
      case 'info': return 'text-blue-400';
      default: return 'text-gray-300';
    }
  };

  const getLogBg = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'bg-red-950/20';
      case 'warn': return 'bg-yellow-950/20';
      case 'info': return 'bg-blue-950/20';
      default: return 'bg-gray-950/20';
    }
  };

  return (
    <>
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-[9999] w-12 h-12 bg-primary hover:bg-primary/90 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110"
          title="Open Debug Console"
        >
          <Terminal className="w-5 h-5" />
        </button>
      )}

      {/* Debug Console Panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-[9999] w-[600px] h-[400px] bg-gray-900 border-2 border-gray-700 rounded-lg shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-white">Debug Console</span>
              <span className="text-xs text-gray-400">({logs.length} logs)</span>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={clearLogs}
                className="h-7 px-2 text-gray-400 hover:text-white hover:bg-gray-700"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Logs */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-xs">
            {logs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No logs yet. Console output will appear here.
              </div>
            ) : (
              logs.map(log => (
                <div
                  key={log.id}
                  className={`p-2 rounded ${getLogBg(log.type)} border border-gray-800`}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-gray-500 text-[10px] mt-0.5 shrink-0">
                      {log.timestamp}
                    </span>
                    <span className={`${getLogColor(log.type)} break-all whitespace-pre-wrap flex-1`}>
                      {log.message}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-800 border-t border-gray-700 text-[10px] text-gray-500">
            Tip: Look for logs starting with [Gallery] or [SimpleGalleryEditor]
          </div>
        </div>
      )}
    </>
  );
}
