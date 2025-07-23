import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VisionAssistChat } from '@/components/VisionAssist/VisionAssistChat';
import { ScreenCapture } from '@/components/VisionAssist/ScreenCapture';
import { SessionHistory } from '@/components/VisionAssist/SessionHistory';
import { PrivacySettings } from '@/components/VisionAssist/PrivacySettings';
import { Eye, Shield, History, Plus, Sparkles } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VisionSession {
  id: string;
  title: string;
  status: string;
  intent_description: string;
  current_step: number;
  total_steps: number;
  created_at: string;
}

const VisionAssist = () => {
  const [activeView, setActiveView] = useState<'new' | 'history' | 'privacy'>('new');
  const [activeSessions, setActiveSessions] = useState<VisionSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<VisionSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_sessions')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setActiveSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: "Error",
        description: "Failed to load vision sessions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewSession = async (intent: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('vision-assist', {
        body: {
          action: 'createSession',
          intent
        }
      });

      if (error) throw error;
      
      if (data.success) {
        setSelectedSession(data.session);
        await loadSessions();
        toast({
          title: "Session Created",
          description: `VisionAssist session started for: ${intent}`,
        });
      }
    } catch (error) {
      console.error('Error creating session:', error);
      toast({
        title: "Error", 
        description: "Failed to create vision session",
        variant: "destructive",
      });
    }
  };

  const resumeSession = (session: VisionSession) => {
    setSelectedSession(session);
  };

  if (selectedSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setSelectedSession(null)}
                className="flex items-center space-x-2"
              >
                <span>← Back to Sessions</span>
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  {selectedSession.title}
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Step {selectedSession.current_step} of {selectedSession.total_steps}
                </p>
              </div>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <Eye className="w-3 h-3 mr-1" />
              Active Session
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ScreenCapture sessionId={selectedSession.id} />
            </div>
            <div className="space-y-6">
              <VisionAssistChat sessionId={selectedSession.id} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VisionAssist
            </h1>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
              BETA
            </Badge>
          </div>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            AI-powered screen automation and guidance. Let our computer vision assistant help you navigate any interface.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex justify-center space-x-4">
          <Button
            variant={activeView === 'new' ? 'default' : 'outline'}
            onClick={() => setActiveView('new')}
            className="flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </Button>
          <Button
            variant={activeView === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveView('history')}
            className="flex items-center space-x-2"
          >
            <History className="w-4 h-4" />
            <span>History</span>
          </Button>
          <Button
            variant={activeView === 'privacy' ? 'default' : 'outline'}
            onClick={() => setActiveView('privacy')}
            className="flex items-center space-x-2"
          >
            <Shield className="w-4 h-4" />
            <span>Privacy</span>
          </Button>
        </div>

        {/* Content Area */}
        <div className="max-w-4xl mx-auto">
          {activeView === 'new' && (
            <div className="space-y-6">
              {/* Quick Start */}
              <Card className="p-6">
                <h2 className="text-2xl font-semibold mb-4 flex items-center space-x-2">
                  <Eye className="w-6 h-6 text-blue-600" />
                  <span>Start New VisionAssist Session</span>
                </h2>
                <NewSessionForm onCreateSession={createNewSession} />
              </Card>

              {/* Active Sessions */}
              {activeSessions.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border hover:shadow-sm transition-shadow cursor-pointer"
                        onClick={() => resumeSession(session)}
                      >
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Step {session.current_step} of {session.total_steps} • Started {new Date(session.created_at).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Resume
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {activeView === 'history' && <SessionHistory />}
          {activeView === 'privacy' && <PrivacySettings />}
        </div>
      </div>
    </div>
  );
};

// Quick start form component
const NewSessionForm = ({ onCreateSession }: { onCreateSession: (intent: string) => void }) => {
  const [intent, setIntent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const templates = [
    { id: 'password-reset', label: 'Reset Password', description: 'Help me reset my password for any application' },
    { id: 'email-setup', label: 'Email Configuration', description: 'Configure email settings in applications' },
    { id: 'vpn-setup', label: 'VPN Setup', description: 'Connect to VPN or configure network settings' },
    { id: 'software-install', label: 'Software Installation', description: 'Install or update software applications' },
    { id: 'custom', label: 'Custom Task', description: 'Describe your own task' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intent.trim()) {
      onCreateSession(intent);
    }
  };

  const selectTemplate = (template: any) => {
    setSelectedTemplate(template.id);
    if (template.id !== 'custom') {
      setIntent(template.description);
    } else {
      setIntent('');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-3">Choose a template or describe your task:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => selectTemplate(template)}
              className={`p-4 text-left border rounded-lg transition-all ${
                selectedTemplate === template.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
              }`}
            >
              <div className="font-medium">{template.label}</div>
              <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {template.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {(selectedTemplate === 'custom' || selectedTemplate) && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Describe what you want to accomplish:
            </label>
            <textarea
              value={intent}
              onChange={(e) => setIntent(e.target.value)}
              placeholder="e.g., Help me reset my Microsoft Teams password"
              className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            disabled={!intent.trim()}
          >
            Start VisionAssist Session
          </Button>
        </form>
      )}
    </div>
  );
};

export default VisionAssist;