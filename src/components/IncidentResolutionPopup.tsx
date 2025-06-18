
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, Star } from 'lucide-react';

interface IncidentResolutionPopupProps {
  incident: {
    id: string;
    title: string;
    description: string;
  };
  suggestedResolution: string;
  onResolve: (rating: number, feedback?: string) => void;
  onEscalate: () => void;
  onClose: () => void;
}

const IncidentResolutionPopup = ({ 
  incident, 
  suggestedResolution, 
  onResolve, 
  onEscalate, 
  onClose 
}: IncidentResolutionPopupProps) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [showRating, setShowRating] = useState(false);

  const handleResolve = () => {
    setShowRating(true);
  };

  const handleSubmitRating = () => {
    onResolve(rating, feedback);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            AI Resolution Suggestion
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Incident: {incident.title}</h3>
            <p className="text-gray-600 text-sm mb-4">{incident.description}</p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Suggested Resolution:</h4>
            <p className="text-blue-700">{suggestedResolution}</p>
          </div>

          {!showRating ? (
            <div className="flex gap-3">
              <Button onClick={handleResolve} className="flex-1 bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                This Resolves My Issue
              </Button>
              <Button onClick={onEscalate} variant="outline" className="flex-1">
                <XCircle className="w-4 h-4 mr-2" />
                Need Human Support
              </Button>
              <Button onClick={onClose} variant="ghost">
                Later
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-3">How would you rate this resolution?</h4>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`p-1 hover:scale-110 transition-transform ${
                        star <= rating ? 'text-yellow-500' : 'text-gray-300'
                      }`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional feedback (optional):
                </label>
                <Textarea
                  placeholder="Any additional comments about the resolution..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  rows={3}
                />
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleSubmitRating} 
                  disabled={rating === 0}
                  className="flex-1"
                >
                  Submit & Close Incident
                </Button>
                <Button onClick={() => setShowRating(false)} variant="outline">
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default IncidentResolutionPopup;
