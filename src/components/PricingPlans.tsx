
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { useState } from 'react';

const PricingPlans = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('annually');

  const plans = [
    {
      name: 'Starter',
      description: 'For getting started',
      monthlyPrice: 500,
      annualPrice: 5000,
      features: [
        'Workspaces',
        'Incident Management',
        'Knowledge Base',
        'Self Service Portal'
      ]
    },
    {
      name: 'Growth', 
      description: 'For IT teams building foundational practices to move from reactive to streamlined service delivery.',
      monthlyPrice: 1200,
      annualPrice: 12000,
      features: [
        'Everything in Starter and...',
        'Service Catalog',
        'Asset Management - Includes 100 managed assets'
      ]
    },
    {
      name: 'Pro',
      description: 'For advancing teams breaking silos and unifying service management across functions.',
      monthlyPrice: 2500,
      annualPrice: 25000,
      features: [
        'Everything in Growth and...',
        'Problem Management',
        'Change Management',
        'Release Management'
      ]
    },
    {
      name: 'Enterprise',
      description: 'For mature IT organizations driving strategic impact with AI and enterprise-wide service excellence.',
      price: 'Custom',
      isCustom: true,
      features: [
        'Everything in Pro and...',
        'Freddy AI Agent',
        'Freddy AI Insights (Beta)'
      ]
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            Scale your IT service management with flexible pricing
          </p>
          
          <div className="inline-flex rounded-lg border border-slate-600/50 p-1 bg-slate-800/50">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'monthly' 
                  ? 'bg-slate-600/50 text-white' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                billingCycle === 'annually' 
                  ? 'bg-slate-600/50 text-white' 
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Annually
              <Badge className="ml-2 bg-blue-600/20 text-blue-400 border-blue-400/30">Save 17%</Badge>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className={`bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 relative ${plan.name === 'Enterprise' ? 'border-purple-500/50' : ''}`}>
              {plan.name === 'Enterprise' && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                <CardDescription className="text-slate-300 min-h-[60px]">
                  {plan.description}
                </CardDescription>
                
                <div className="mt-4">
                  {plan.isCustom ? (
                    <div className="text-4xl font-bold text-white">Custom</div>
                  ) : (
                    <>
                      <div className="text-4xl font-bold text-white">
                        ₹{billingCycle === 'monthly' ? plan.monthlyPrice.toLocaleString() : plan.annualPrice.toLocaleString()}
                      </div>
                      <div className="text-slate-400 text-sm">
                        /agent/{billingCycle === 'monthly' ? 'month' : 'year'}, billed {billingCycle}
                      </div>
                    </>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <Button 
                  className={`w-full mb-6 ${
                    plan.name === 'Enterprise' 
                      ? 'bg-purple-600 hover:bg-purple-700' 
                      : 'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50'
                  }`}
                  variant={plan.name === 'Enterprise' ? 'default' : 'outline'}
                >
                  {plan.isCustom ? 'Contact us' : 'Try it Free'}
                </Button>
                
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <Check className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
