
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Users, BarChart3, Shield, Clock, Zap, CheckCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useImprovedAuth } from "@/contexts/ImprovedAuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, loading } = useImprovedAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      // Redirect authenticated users to their dashboard
      if (user.isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mm00djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="text-center">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center animate-pulse">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white">Authexa ITSM</h1>
          </div>
          <p className="text-blue-200 text-xl mb-8">Please wait while we initialize your experience</p>
          <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Don't show the landing page if user is authenticated
  if (user) {
    return null;
  }

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Automation",
      description: "Intelligent ticket routing and automated responses powered by advanced AI algorithms",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Seamless collaboration tools to keep your IT team connected and productive",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description: "Comprehensive insights and reporting to optimize your IT operations",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Multi-factor authentication and role-based access control for maximum security",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Clock,
      title: "24/7 Monitoring",
      description: "Round-the-clock system monitoring with real-time alerts and notifications",
      color: "from-teal-500 to-blue-500"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance for rapid issue resolution and user satisfaction",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  const benefits = [
    "Reduce incident resolution time by up to 70%",
    "Improve team productivity with automated workflows",
    "Enhance customer satisfaction with faster response times",
    "Gain insights with comprehensive analytics and reporting"
  ];

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0di00aC0ydjRoLTR2Mmg0djRoMnYtNGg0di0yaC00em0wLTMwVjBoLTJ2NGgtNHYyaDR2NGgyVjZoNFY0aC00ek02IDM0di00SDR2NEgwdjJoNHY0aDJ2LTRoNHYtMkg2ek02IDRWMEg0djRIMHYyaDR2NEgyVjZoNFY0SDZ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Authexa ITSM</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/signin">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
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
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Transform Your IT
            <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent block">
              Service Management
            </span>
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto leading-relaxed">
            Streamline your IT operations with AI-powered automation, intelligent ticket routing, 
            and comprehensive analytics in one powerful platform.
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-12">
            <Link to="/signup">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4">
                Watch Demo
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">70%</div>
              <div className="text-blue-200 text-sm">Faster Resolution</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">50+</div>
              <div className="text-blue-200 text-sm">Integrations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">99.9%</div>
              <div className="text-blue-200 text-sm">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-200 text-sm">Support</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Modern IT Teams
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              Everything you need to manage your IT services efficiently and effectively
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/15 transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-100">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Benefits Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Why Choose Authexa ITSM?
            </h2>
            <p className="text-xl text-blue-200">
              Join thousands of IT teams who have transformed their operations
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-4 p-6 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
                <span className="text-white text-lg">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm rounded-2xl p-12 border border-white/20">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your IT Operations?
            </h2>
            <p className="text-xl text-blue-200 mb-8">
              Start your free trial today and experience the power of AI-driven IT service management
            </p>
            
            <div className="flex items-center justify-center gap-4">
              <Link to="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg px-8 py-4">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/signin">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 text-lg px-8 py-4">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/20">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Authexa ITSM</span>
          </div>
          <p className="text-blue-200">
            © 2024 Authexa. All rights reserved. Transforming IT service management with AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
