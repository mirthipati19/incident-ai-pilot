import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, Zap, BarChart3, Users, Settings, Headphones } from 'lucide-react';
import VoiceControlledInstaller from '@/components/VoiceControlledInstaller';
import PricingPlans from '@/components/PricingPlans';
import ThemeToggle from '@/components/ThemeToggle';
import SimranAssistant from '@/components/SimranAssistant';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 bg-white dark:bg-slate-900 transition-colors">
      {/* Navigation */}
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 sticky top-0 z-50 dark:bg-slate-900/80 bg-white/80 dark:border-slate-700/50 border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white dark:text-white text-gray-900">Authexa Support</span>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link to="/signin">
                <Button variant="outline" className="bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700/50 dark:bg-slate-800/50 dark:border-slate-600/50 dark:text-white dark:hover:bg-slate-700/50 bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 dark:text-white text-gray-900">
            Welcome to{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
              Authexa Support
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto dark:text-slate-300 text-gray-600">
            Enterprise-grade IT Service Management platform that streamlines your support operations with intelligent automation and comprehensive analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 text-lg">
                Start Your Journey
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700/50 px-8 py-4 text-lg dark:bg-slate-800/50 dark:border-slate-600/50 dark:text-white dark:hover:bg-slate-700/50 bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Voice-Controlled Installer Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30 dark:bg-slate-900/30 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 dark:text-white text-gray-900">
              Voice-Controlled Software Installation
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto dark:text-slate-300 text-gray-600">
              Revolutionary voice-controlled software installation system. Speak your requirements and get instant Windows batch files for automated software deployment.
            </p>
          </div>
          <VoiceControlledInstaller />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 dark:text-white text-gray-900">
              Powerful Features
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto dark:text-slate-300 text-gray-600">
              Everything you need to manage your IT support operations efficiently
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:bg-slate-800/70 bg-white border-gray-200 hover:bg-gray-50">
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 dark:text-white text-gray-900">Intelligent Automation</h3>
              <p className="text-slate-300 dark:text-slate-300 text-gray-600">
                Automate routine tasks and streamline workflows with AI-powered automation tools.
              </p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:bg-slate-800/70 bg-white border-gray-200 hover:bg-gray-50">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 dark:text-white text-gray-900">Comprehensive Analytics</h3>
              <p className="text-slate-300 dark:text-slate-300 text-gray-600">
                Get detailed insights into your support operations with advanced analytics and reporting.
              </p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:bg-slate-800/70 bg-white border-gray-200 hover:bg-gray-50">
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 dark:text-white text-gray-900">Team Collaboration</h3>
              <p className="text-slate-300 dark:text-slate-300 text-gray-600">
                Enhance team productivity with integrated collaboration tools and communication features.
              </p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:bg-slate-800/70 bg-white border-gray-200 hover:bg-gray-50">
              <div className="w-12 h-12 bg-red-600/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 dark:text-white text-gray-900">Enterprise Security</h3>
              <p className="text-slate-300 dark:text-slate-300 text-gray-600">
                Bank-level security with multi-factor authentication and advanced access controls.
              </p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:bg-slate-800/70 bg-white border-gray-200 hover:bg-gray-50">
              <div className="w-12 h-12 bg-yellow-600/20 rounded-lg flex items-center justify-center mb-4">
                <Settings className="w-6 h-6 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 dark:text-white text-gray-900">Customizable Workflows</h3>
              <p className="text-slate-300 dark:text-slate-300 text-gray-600">
                Tailor the platform to your specific needs with flexible workflow configurations.
              </p>
            </div>
            
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 hover:bg-slate-800/70 transition-colors dark:bg-slate-800/50 dark:border-slate-700/50 dark:hover:bg-slate-800/70 bg-white border-gray-200 hover:bg-gray-50">
              <div className="w-12 h-12 bg-cyan-600/20 rounded-lg flex items-center justify-center mb-4">
                <Headphones className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2 dark:text-white text-gray-900">24/7 Support</h3>
              <p className="text-slate-300 dark:text-slate-300 text-gray-600">
                Round-the-clock support with our dedicated team of experts ready to help you.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Plans Section */}
      <PricingPlans />

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600/20 to-cyan-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 dark:text-white text-gray-900">
            Ready to Transform Your IT Support?
          </h2>
          <p className="text-xl text-slate-300 mb-8 dark:text-slate-300 text-gray-600">
            Join thousands of organizations already using Authexa Support to streamline their operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4">
                Get Started Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="bg-slate-800/50 border-slate-600/50 text-white hover:bg-slate-700/50 px-8 py-4 dark:bg-slate-800/50 dark:border-slate-600/50 dark:text-white dark:hover:bg-slate-700/50 bg-white border-gray-300 text-gray-900 hover:bg-gray-50">
                Sign In to Your Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-sm border-t border-slate-700/50 py-12 dark:bg-slate-900/80 dark:border-slate-700/50 bg-white border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white dark:text-white text-gray-900">Authexa Support</span>
            </div>
            <p className="text-slate-400 text-center md:text-right dark:text-slate-400 text-gray-500">
              © 2024 Authexa Support. All rights reserved.<br />
              Enterprise-grade IT Service Management platform.
            </p>
          </div>
        </div>
      </footer>

      {/* Simran Assistant */}
      <SimranAssistant />
    </div>
  );
};

export default Index;
