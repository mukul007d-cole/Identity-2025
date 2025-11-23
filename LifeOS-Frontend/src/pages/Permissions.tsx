import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Camera, Mic, MapPin, Bell, Shield } from 'lucide-react';

const Permissions = () => {
  const { state, updatePermission } = useApp();

  const permissions = [
    {
      id: 'camera' as const,
      title: 'Camera Access',
      description: 'Allow LifeOS to access your device camera for live feed and captures',
      icon: Camera,
      required: true,
    },
    {
      id: 'microphone' as const,
      title: 'Microphone Access',
      description: 'Enable voice commands and audio recording features',
      icon: Mic,
      required: true,
    },
    {
      id: 'location' as const,
      title: 'Location Services',
      description: 'Access location data for context-aware features',
      icon: MapPin,
      required: false,
    },
    {
      id: 'notifications' as const,
      title: 'Notifications',
      description: 'Receive alerts and updates from LifeOS',
      icon: Bell,
      required: false,
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">Permissions</h1>
          </div>
          <p className="text-muted-foreground">
            Manage what LifeOS can access on your device
          </p>
        </div>

        <Card className="glass-card border-0 mb-6">
          <CardHeader>
            <CardTitle>Privacy & Security</CardTitle>
            <CardDescription>
              We take your privacy seriously. Only enable permissions you're comfortable with.
              Required permissions are necessary for core functionality.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {permissions.map((permission) => {
            const Icon = permission.icon;
            const isEnabled = state.permissions[permission.id];
            
            return (
              <Card key={permission.id} className="glass-card border-0">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <Label htmlFor={permission.id} className="text-base font-semibold">
                            {permission.title}
                            {permission.required && (
                              <span className="ml-2 text-xs text-primary">(Required)</span>
                            )}
                          </Label>
                        </div>
                        <Switch
                          id={permission.id}
                          checked={isEnabled}
                          onCheckedChange={(checked) => updatePermission(permission.id, checked)}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="glass-card border-0 mt-6">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-2">About Permissions</h3>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                • Required permissions are essential for LifeOS to function properly
              </p>
              <p>
                • You can change these settings at any time
              </p>
              <p>
                • Some features may be limited if permissions are disabled
              </p>
              <p>
                • Your data is encrypted and never shared without consent
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Permissions;
