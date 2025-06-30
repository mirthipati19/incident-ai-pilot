
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Shield, Zap, Users, BarChart3, Mic, Bot, Sparkles } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import VoiceControlledInstaller from "@/components/VoiceControlledInstaller";

const Index = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const features = [
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Advanced multi-factor authentication with hCaptcha protection and organizational access control."
    },
    {
      icon: Zap,
      title: "AI-Powered Automation",
      description: "Intelligent incident resolution with Google Gemini AI and voice-controlled software installation."
    },
    {
      icon: Users,
      title: "Multi-Organization Support",
      description: "Isolated organizational environments with custom branding and role-based access control."
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive dashboards with real-time metrics and performance insights."
    }
  ];

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' 
        : 'bg-gradient-to-br from-sky-50 via-white to-blue-50'
    }`}>
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className={`text-2xl font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  Authexa
                </h1>
                <p className={`text-sm ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Enterprise ITSM Platform
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                onClick={() => navigate('/signin')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Sign In
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl backdrop-blur-sm border border-blue-500/20">
              <Bot className={`w-16 h-16 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </div>
          <h2 className={`text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Next-Generation
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent block">
              ITSM Platform
            </span>
          </h2>
          <p className={`text-xl max-w-3xl mx-auto mb-8 ${
            isDarkMode ? 'text-slate-300' : 'text-slate-600'
          }`}>
            Experience the future of IT Service Management with AI-powered automation, 
            voice-controlled software installation, and enterprise-grade security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/signup')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started Free
            </Button>
            <Button 
              onClick={() => navigate('/itsm')}
              size="lg"
              variant="outline"
              className={`px-8 py-4 rounded-xl border-2 transition-all duration-200 ${
                isDarkMode 
                  ? 'border-slate-600 text-white hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Mic className="w-5 h-5 mr-2" />
              Try Demo
            </Button>
          </div>
        </div>

        {/* Voice Installer Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className={`text-3xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              🎙️ Voice-Controlled Software Installation
            </h3>
            <p className={`text-lg ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Revolutionary voice-controlled software installation system. Speak your requirements and get instant Windows batch files for automated software deployment.
            </p>
          </div>
          <VoiceControlledInstaller />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className={`group hover:shadow-xl transition-all duration-300 ${
              isDarkMode 
                ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70' 
                : 'bg-white/80 border-slate-200/50 hover:bg-white'
            } backdrop-blur-sm`}>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl group-hover:scale-110 transition-transform duration-200">
                  <feature.icon className={`w-8 h-8 ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <CardTitle className={`text-lg ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}>
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-sm text-center ${
                  isDarkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <Card className={`text-center p-8 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-slate-800/50 to-slate-700/50 border-slate-600/50' 
            : 'bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-blue-200/50'
        } backdrop-blur-sm`}>
          <CardContent className="space-y-6">
            <h3 className={`text-2xl font-bold ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              Ready to Transform Your IT Operations?
            </h3>
            <p className={`text-lg max-w-2xl mx-auto ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Join thousands of organizations already using Authexa to streamline their IT service management with AI-powered automation.
            </p>
            <Button 
              onClick={() => navigate('/signup')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Start Your Free Trial
            </Button>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className={`mt-16 border-t ${
        isDarkMode ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white/50'
      } backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className={`text-sm ${
              isDarkMode ? 'text-slate-400' : 'text-slate-600'
            }`}>
              © 2024 Authexa. All rights reserved. Enterprise ITSM Platform with AI-Powered Automation.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
