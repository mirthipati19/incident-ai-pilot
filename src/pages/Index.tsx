
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Shield, Zap, Users, BarChart3, ArrowRight, CheckCircle, Star, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useImprovedAuth } from "@/contexts/ImprovedAuthContext";
import { useEffect } from "react";

const Index = () => {
  const { user, loading } = useImprovedAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Show loading state while checking authentication - improved with timeout
  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mx-auto animate-pulse">
            <Bot className="w-8 h-8 text-white" />
          </div>
          <div className="text-white text-lg">Loading Authexa ITSM...</div>
          <div className="text-blue-200 text-sm">Please wait while we initialize your experience</div>
        </div>
      </div>
    );
  }

  // Show landing page for non-authenticated users
  const features = [
    {
      icon: <Zap className="w-6 h-6 text-blue-500" />,
      title: "AI-Powered Automation",
      description: "Intelligent ticket routing and automated resolution suggestions powered by advanced AI"
    },
    {
      icon: <Users className="w-6 h-6 text-purple-500" />,
      title: "Team Collaboration",
      description: "Seamless communication tools and shared knowledge base for your IT team"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-green-500" />,
      title: "Advanced Analytics",
      description: "Real-time insights and performance metrics to optimize your IT operations"
    },
    {
      icon: <Shield className="w-6 h-6 text-orange-500" />,
      title: "Enterprise Security",
      description: "Bank-grade security with multi-factor authentication and compliance features"
    }
  ];

  const benefits = [
    "Reduce ticket resolution time by 60%",
    "Automate 80% of routine IT tasks",
    "24/7 AI-powered support assistant",
    "Enterprise-grade security & compliance",
    "Seamless integration with existing tools",
    "Real-time performance monitoring"
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      {/* Header */}
      <header className="relative z-10 px-4 py-6 w-full">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Authexa ITSM</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/signin">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-4 pt-8 pb-24 w-full">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-blue-200 text-sm font-medium">AI-Powered ITSM Platform</span>
            </div>
            <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Transform Your
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"> IT Operations</span>
            </h2>
            <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
              Experience the future of IT Service Management with AI-driven automation, intelligent insights, and seamless team collaboration
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto w-full sm:w-auto">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4 h-auto w-full sm:w-auto">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white h-full">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mb-3">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-200">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Benefits Section */}
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-16">
            <h3 className="text-3xl font-bold text-white mb-8">Why Choose Authexa ITSM?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-left">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-blue-200">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-500/20 rounded-2xl p-8">
            <h3 className="text-3xl font-bold text-white mb-4">Ready to Get Started?</h3>
            <p className="text-blue-200 mb-6 text-lg">
              Join thousands of IT teams already using Authexa ITSM to streamline their operations
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
              <span className="text-white ml-2 font-semibold">4.9/5 from 1,200+ reviews</span>
            </div>
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4 h-auto">
                Start Your Free Trial Today
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
