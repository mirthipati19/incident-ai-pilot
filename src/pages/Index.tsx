
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeadphonesIcon, Zap, Shield, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div 
      className="min-h-screen relative"
      style={{
        backgroundImage: `url('/lovable-uploads/50b753fc-5735-49ae-ad55-1cc4efdd1bc3.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600/80 backdrop-blur-sm rounded-full border border-white/20">
              <HeadphonesIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            Welcome to Mouritech Support
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto drop-shadow-md">
            AI-powered IT Service Management with voice recognition, automated incident handling, 
            and ServiceNow-style workflow management.
          </p>
          <Link to="/itsm">
            <Button size="lg" className="text-lg px-8 py-4 bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm border border-white/20">
              Launch Support Assistant
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-4 border border-white/30">
                <Zap className="w-6 h-6 text-blue-300" />
              </div>
              <CardTitle className="text-white">Voice-Activated Support</CardTitle>
              <CardDescription className="text-white/80">
                Speak naturally to create incidents, check status, and get instant assistance with our Siri-style voice interface.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-4 border border-white/30">
                <Shield className="w-6 h-6 text-green-300" />
              </div>
              <CardTitle className="text-white">Smart Automation</CardTitle>
              <CardDescription className="text-white/80">
                Intelligent routing, auto-assignment, and priority classification based on AI analysis of incident content.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/15 transition-all hover:shadow-xl">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100/20 backdrop-blur-sm rounded-lg flex items-center justify-center mb-4 border border-white/30">
                <Users className="w-6 h-6 text-purple-300" />
              </div>
              <CardTitle className="text-white">ServiceNow Experience</CardTitle>
              <CardDescription className="text-white/80">
                Familiar interface with modern design, comprehensive incident tracking, and powerful filtering capabilities.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-white">Platform Capabilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-300 mb-2">24/7</div>
              <div className="text-white/80">AI Availability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-300 mb-2">90%</div>
              <div className="text-white/80">Auto-Resolution</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-300 mb-2">60s</div>
              <div className="text-white/80">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-300 mb-2">99.9%</div>
              <div className="text-white/80">Uptime SLA</div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4 text-white drop-shadow-lg">Ready to Transform Your Support?</h2>
          <p className="text-lg text-white/90 mb-8 drop-shadow-md">
            Experience the future of IT service management with our intelligent assistant.
          </p>
          <Link to="/itsm">
            <Button variant="outline" size="lg" className="mr-4 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
              View Demo
            </Button>
          </Link>
          <Button size="lg" className="bg-blue-600/80 hover:bg-blue-700/80 backdrop-blur-sm border border-white/20">
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
