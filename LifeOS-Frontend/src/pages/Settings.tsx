import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Moon, Sun, User, Mail, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const Settings = () => {
  const { state, updateUserDetails, toggleTheme } = useApp();

  const handleClearData = () => {
    if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Settings</h1>
          <p className="text-muted-foreground">Customize your LifeOS experience</p>
        </div>

        {/* Appearance */}
        <Card className="glass-card border-0 mb-6">
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how LifeOS looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {state.theme === 'dark' ? (
                  <Moon className="w-5 h-5 text-primary" />
                ) : (
                  <Sun className="w-5 h-5 text-primary" />
                )}
                <div>
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    {state.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                  </p>
                </div>
              </div>
              <Switch
                checked={state.theme === 'dark'}
                onCheckedChange={toggleTheme}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile */}
        <Card className="glass-card border-0 mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4" />
                Name
              </Label>
              <Input
                id="name"
                placeholder="Your name"
                value={state.userDetails.name}
                onChange={(e) => updateUserDetails({ name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={state.userDetails.email}
                onChange={(e) => updateUserDetails({ email: e.target.value })}
              />
            </div>
            <Button 
              onClick={() => toast.success('Profile updated successfully')}
              className="w-full"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Device Info */}
        <Card className="glass-card border-0 mb-6">
          <CardHeader>
            <CardTitle>Device Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="font-medium">
                {state.userDetails.deviceConnected ? (
                  <span className="text-primary">Connected</span>
                ) : (
                  <span className="text-muted-foreground">Not Connected</span>
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Firmware Version</span>
              <span className="font-medium">v2.1.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Battery Level</span>
              <span className="font-medium">85%</span>
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card className="glass-card border-0 mb-6">
          <CardHeader>
            <CardTitle>Storage & Data</CardTitle>
            <CardDescription>Manage your local data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saved Images</span>
              <span className="font-medium">{state.savedImages.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Saved Faces</span>
              <span className="font-medium">{state.savedFaces.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Notes</span>
              <span className="font-medium">{state.notes.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Voice Inputs</span>
              <span className="font-medium">{state.voiceInputs.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="glass-card border-0 border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleClearData}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All Data
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
