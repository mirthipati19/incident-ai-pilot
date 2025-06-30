
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shield, Users, BarChart3, Zap } from 'lucide-react';
import VoiceControlledInstaller from '@/components/VoiceControlledInstaller';
import ThemeToggle from '@/components/ThemeToggle';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600/20 backdrop-blur-sm rounded-full border border-blue-500/30">
              <Shield className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">
            Authexa Support
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Revolutionary AI-powered support platform with voice-controlled automation,
            multi-factor authentication, and enterprise-grade security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signin">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" size="lg" className="border-slate-600 text-slate-200 hover:bg-slate-800 px-8 py-3 text-lg font-medium">
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Voice-Controlled Software Installer */}
        <div className="mb-16">
          <VoiceControlledInstaller />
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle className="text-white">Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Multi-factor authentication, advanced encryption, and comprehensive audit trails
                to keep your organization secure.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <CardTitle className="text-white">AI-Powered Automation</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Voice-controlled software installation and intelligent incident resolution
                powered by Google Gemini AI.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
            <CardHeader>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-green-400" />
              </div>
              <CardTitle className="text-white">Organization Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-300">
                Multi-tenant architecture with organization-based access control and
                custom branding support.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="text-center bg-slate-800/30 backdrop-blur-xl rounded-2xl p-8 border border-slate-700/50">
          <h2 className="text-3xl font-bold text-white mb-8">Trusted by Organizations</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="text-4xl font-bold text-blue-400 mb-2">99.9%</div>
              <div className="text-slate-300">Uptime Guarantee</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">24/7</div>
              <div className="text-slate-300">AI Support</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-400 mb-2">SOC 2</div>
              <div className="text-slate-300">Compliant</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
