
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeadphonesIcon, Zap, Shield, Users, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-blue-600 rounded-full">
              <HeadphonesIcon className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Smart Support Assistant
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI-powered IT Service Management with voice recognition, automated incident handling, 
            and ServiceNow-style workflow management.
          </p>
          <Link to="/itsm">
            <Button size="lg" className="text-lg px-8 py-4">
              Launch Support Assistant
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Voice-Activated Support</CardTitle>
              <CardDescription>
                Speak naturally to create incidents, check status, and get instant assistance with our Siri-style voice interface.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Smart Automation</CardTitle>
              <CardDescription>
                Intelligent routing, auto-assignment, and priority classification based on AI analysis of incident content.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>ServiceNow Experience</CardTitle>
              <CardDescription>
                Familiar interface with modern design, comprehensive incident tracking, and powerful filtering capabilities.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Platform Capabilities</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">24/7</div>
              <div className="text-gray-600">AI Availability</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">90%</div>
              <div className="text-gray-600">Auto-Resolution</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">60s</div>
              <div className="text-gray-600">Avg Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime SLA</div>
            </div>
          </div>
        </div>

        {/* Getting Started */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Support?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Experience the future of IT service management with our intelligent assistant.
          </p>
          <Link to="/itsm">
            <Button variant="outline" size="lg" className="mr-4">
              View Demo
            </Button>
          </Link>
          <Button size="lg">
            Get Started
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
