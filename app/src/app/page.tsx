'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Activity, Users, BarChart3, BookOpen,
  Zap, Settings, HelpCircle, Radio
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import AgentView from '@/components/AgentView';
import AdminView from '@/components/AdminView';
import RulesView from '@/components/RulesView';

type View = 'agent' | 'admin' | 'rules';

export default function Home() {
  const [currentView, setCurrentView] = useState<View>('agent');
  const [llmStatus, setLlmStatus] = useState<{ available: boolean; model: string } | null>(null);
  const [checkingLlm, setCheckingLlm] = useState(true);

  // Check LLM status on mount
  useEffect(() => {
    checkLlmStatus();
  }, []);

  const checkLlmStatus = async () => {
    setCheckingLlm(true);
    try {
      // Try to connect to Ollama
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(3000),
      });

      if (response.ok) {
        const data = await response.json();
        const hasModel = data.models?.some((m: { name: string }) =>
          m.name.startsWith('llama') || m.name.includes('mistral') || m.name.includes('gemma')
        );

        setLlmStatus({
          available: true,
          model: data.models?.[0]?.name || 'llama3.2:1b'
        });

        if (hasModel) {
          toast.success('Local LLM connected', { duration: 3000 });
        } else {
          toast('LLM available but no model loaded', { icon: '⚠️' });
        }
      } else {
        setLlmStatus({ available: false, model: '' });
      }
    } catch {
      setLlmStatus({ available: false, model: '' });
    } finally {
      setCheckingLlm(false);
    }
  };

  const tabs = [
    { id: 'agent', label: 'Agent View', icon: Radio },
    { id: 'admin', label: 'Admin Dashboard', icon: BarChart3 },
    { id: 'rules', label: 'Rule Library', icon: BookOpen },
  ];

  return (
    <div className="app-container">
      {/* Skip Link */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Toast Container */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            fontSize: '0.875rem',
          },
          success: {
            iconTheme: { primary: 'var(--severity-low)', secondary: 'white' },
          },
          error: {
            iconTheme: { primary: 'var(--severity-high)', secondary: 'white' },
            style: {
              borderColor: 'var(--severity-high-border)',
              background: 'var(--severity-high-bg)',
            },
          },
        }}
      />

      {/* Header */}
      <header className="header">
        <div className="header-inner">
          {/* Logo */}
          <div className="logo">
            <div className="logo-icon">
              <Shield size={20} color="white" strokeWidth={2.5} />
            </div>
            <div className="logo-text">
              <h1>Whisperwire</h1>
              <span>TCPA Compliance Copilot</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="nav-tabs" role="tablist" aria-label="Main navigation">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={currentView === tab.id}
                  aria-controls={`${tab.id}-panel`}
                  className={`nav-tab ${currentView === tab.id ? 'active' : ''}`}
                  onClick={() => setCurrentView(tab.id as View)}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Status Indicators */}
          <div className="status-group">
            {checkingLlm ? (
              <span className="status-pill">
                <Activity size={12} className="animate-pulse" />
                Checking LLM...
              </span>
            ) : llmStatus?.available ? (
              <span className="status-pill llm-active">
                <span className="status-dot" />
                <Zap size={12} />
                LLM Active
              </span>
            ) : (
              <span className="status-pill">
                <Shield size={12} />
                Rules Mode
              </span>
            )}

            <button className="btn-ghost" aria-label="Help">
              <HelpCircle size={18} />
            </button>
            <button className="btn-ghost" aria-label="Settings">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="main-content">
        <AnimatePresence mode="wait">
          {currentView === 'agent' && (
            <motion.div
              key="agent"
              role="tabpanel"
              id="agent-panel"
              aria-labelledby="agent-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AgentView llmStatus={llmStatus} />
            </motion.div>
          )}

          {currentView === 'admin' && (
            <motion.div
              key="admin"
              role="tabpanel"
              id="admin-panel"
              aria-labelledby="admin-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <AdminView />
            </motion.div>
          )}

          {currentView === 'rules' && (
            <motion.div
              key="rules"
              role="tabpanel"
              id="rules-panel"
              aria-labelledby="rules-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <RulesView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Disclaimer */}
      <footer className="disclaimer-footer">
        <div className="disclaimer-text">
          <span>
            <strong>⚠️ Legal Disclaimer:</strong> Whisperwire provides compliance risk signals only.
            This is NOT legal advice. Compliance requirements depend on jurisdiction and require legal counsel review.
          </span>
          <span>© 2026 Whisperwire • v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}
