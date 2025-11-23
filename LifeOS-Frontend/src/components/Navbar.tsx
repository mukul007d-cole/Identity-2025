import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutDashboard, MessageSquare, Settings, HelpCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/assistant', icon: MessageSquare, label: 'Assistant' },
  { to: '/permissions', icon: Shield, label: 'Permissions' },
  { to: '/settings', icon: Settings, label: 'Settings' },
  { to: '/help', icon: HelpCircle, label: 'Help' },
];

export const Navbar = () => {
  const location = useLocation();
  const { state, updateUserDetails } = useApp();

  const handleConnectionToggle = () => {
    if (state.userDetails.deviceConnected) {
      updateUserDetails({ deviceConnected: false });
      toast.success('Disconnected from LifeOS Glasses');
    } else {
      updateUserDetails({ deviceConnected: true });
      toast.success('Connected to LifeOS Glasses');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-tech-glow-secondary flex items-center justify-center">
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <span className="font-bold text-xl gradient-text">LifeOS</span>
          </Link>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              );
            })}
            
            <Button
              onClick={handleConnectionToggle}
              variant={state.userDetails.deviceConnected ? "default" : "secondary"}
              size="sm"
              className="ml-2"
            >
              <div className={cn(
                "w-2 h-2 rounded-full mr-2",
                state.userDetails.deviceConnected ? "bg-green-400 animate-pulse" : "bg-muted-foreground"
              )} />
              {state.userDetails.deviceConnected ? 'Connected' : 'Disconnected'}
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
