import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Eye, 
  EyeOff, 
  Lock, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PrivacySettings {
  mask_sensitive_fields: boolean;
  auto_redact_passwords: boolean;
  store_screenshots: boolean;
  allow_ai_control: boolean;
  session_retention_days: number;
  consent_given_at?: string;
}

export const PrivacySettings = () => {
  const [settings, setSettings] = useState<PrivacySettings>({
    mask_sensitive_fields: true,
    auto_redact_passwords: true,
    store_screenshots: false,
    allow_ai_control: false,
    session_retention_days: 7
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_privacy_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
        setConsentGiven(!!data.consent_given_at);
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('vision_privacy_settings')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          ...settings,
          consent_given_at: consentGiven ? new Date().toISOString() : null
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your privacy settings have been updated",
      });
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save privacy settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const giveConsent = () => {
    setConsentGiven(true);
    updateSetting('consent_given_at', new Date().toISOString());
  };

  const revokeConsent = () => {
    setConsentGiven(false);
    updateSetting('consent_given_at', undefined);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold flex items-center space-x-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <span>Privacy & Security Settings</span>
          </h2>
          <Badge variant="outline" className={consentGiven ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}>
            {consentGiven ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Consent Given
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Consent Required
              </>
            )}
          </Badge>
        </div>

        <p className="text-gray-600 dark:text-gray-400">
          Control how VisionAssist handles your data and privacy. These settings ensure your sensitive information stays secure.
        </p>
      </Card>

      {/* Consent Section */}
      {!consentGiven && (
        <Card className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Consent Required
              </h3>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">
                To use VisionAssist, please review and accept our privacy practices. 
                You can revoke consent at any time, which will disable VisionAssist features.
              </p>
              <div className="space-y-3">
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  <p className="font-medium mb-1">We will:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Process screenshots only for AI analysis</li>
                    <li>Automatically redact sensitive information</li>
                    <li>Delete data according to your retention settings</li>
                    <li>Never share your data with third parties</li>
                  </ul>
                </div>
                <Button
                  onClick={giveConsent}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  Accept and Enable VisionAssist
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Privacy Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Eye className="w-5 h-5 text-blue-600" />
          <span>Screen Analysis Privacy</span>
        </h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="font-medium">Mask Sensitive Fields</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically detect and hide password fields, credit card numbers, and other sensitive data
              </p>
            </div>
            <Switch
              checked={settings.mask_sensitive_fields}
              onCheckedChange={(checked) => updateSetting('mask_sensitive_fields', checked)}
              disabled={!consentGiven}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="font-medium">Auto-Redact Passwords</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Automatically black out password fields before AI analysis
              </p>
            </div>
            <Switch
              checked={settings.auto_redact_passwords}
              onCheckedChange={(checked) => updateSetting('auto_redact_passwords', checked)}
              disabled={!consentGiven}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="font-medium">Store Screenshots</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Keep screenshots for session history and debugging (not recommended for sensitive work)
              </p>
            </div>
            <Switch
              checked={settings.store_screenshots}
              onCheckedChange={(checked) => updateSetting('store_screenshots', checked)}
              disabled={!consentGiven}
            />
          </div>
        </div>
      </Card>

      {/* Control Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Settings className="w-5 h-5 text-blue-600" />
          <span>Control & Automation</span>
        </h3>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <label className="font-medium">Allow AI Control</label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Permit VisionAssist to control your mouse and keyboard for automated actions
              </p>
            </div>
            <Switch
              checked={settings.allow_ai_control}
              onCheckedChange={(checked) => updateSetting('allow_ai_control', checked)}
              disabled={!consentGiven}
            />
          </div>

          {settings.allow_ai_control && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-700 dark:text-amber-300">
                  <p className="font-medium mb-1">Security Notice</p>
                  <p>
                    AI control allows VisionAssist to perform clicks and keystrokes. 
                    Always review instructions before allowing automated actions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Data Retention */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <span>Data Retention</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block font-medium mb-2">Session Retention Period</label>
            <Select
              value={settings.session_retention_days.toString()}
              onValueChange={(value) => updateSetting('session_retention_days', parseInt(value))}
              disabled={!consentGiven}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Day</SelectItem>
                <SelectItem value="3">3 Days</SelectItem>
                <SelectItem value="7">1 Week (Recommended)</SelectItem>
                <SelectItem value="14">2 Weeks</SelectItem>
                <SelectItem value="30">1 Month</SelectItem>
                <SelectItem value="90">3 Months</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              How long to keep session data before automatic deletion
            </p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Privacy Actions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manage your consent and data
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {consentGiven && (
              <Button
                variant="outline"
                onClick={revokeConsent}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                Revoke Consent
              </Button>
            )}
            <Button
              onClick={savePrivacySettings}
              disabled={saving || !consentGiven}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};