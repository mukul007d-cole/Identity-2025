import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

const Landing = () => {
  const navigate = useNavigate();
  const { updateUserDetails, setConnecting } = useApp();
  const [connectionStep, setConnectionStep] = useState(0);

  const handleConnect = async () => {
    setConnectionStep(1);
    setConnecting(true);
    
    setTimeout(() => {
      setConnectionStep(2);
    }, 1000);
    
    setTimeout(() => {
      setConnectionStep(3);
      updateUserDetails({ deviceConnected: true });
      setConnecting(false);
      toast.success('Connected to LifeOS Glasses!');
      
      setTimeout(() => {
        navigate('/assistant');
      }, 800);
    }, 2500);
  };

  return (
    <div className="min-h-screen">
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-tech-glow-secondary/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,hsl(var(--primary)/0.1),transparent_50%)]" />
        
        <div className="container relative z-10 px-4 py-20 text-center max-w-2xl">
          <div className="animate-pulse-glow inline-block mb-8">
            <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-primary to-tech-glow-secondary flex items-center justify-center">
              <Eye className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <h1 className="text-7xl md:text-8xl font-bold mb-6">
            <span className="gradient-text">LifeOS</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12">
            Smart glasses powered by AI
          </p>

          {connectionStep === 0 ? (
            <Button 
              onClick={handleConnect}
              size="lg"
              className="text-lg px-12 py-6 h-auto tech-glow"
            >
              Connect to Glasses
            </Button>
          ) : (
            <div className="glass-card p-12 rounded-xl max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-tech-glow-secondary flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                  <Eye className="w-10 h-10 text-white" />
                </div>
                
                <h3 className="text-xl font-semibold mb-4">
                  {connectionStep === 1 && 'Searching for device...'}
                  {connectionStep === 2 && 'Connecting...'}
                  {connectionStep === 3 && 'Connected!'}
                </h3>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-primary to-tech-glow-secondary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(connectionStep / 3) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;
