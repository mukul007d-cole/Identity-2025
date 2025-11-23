import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Mic, Image, Users, FileText } from 'lucide-react';

const Dashboard = () => {
  const { state } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const todayStats = {
    voiceInteractions: state.voiceInputs.filter(v => 
      new Date(v.timestamp).toDateString() === selectedDate.toDateString()
    ).length,
    imagesCaptured: state.savedImages.filter(i => 
      new Date(i.timestamp).toDateString() === selectedDate.toDateString()
    ).length,
    facesRecognized: state.savedFaces.filter(f => 
      new Date(f.timestamp).toDateString() === selectedDate.toDateString()
    ).length,
    notesCreated: state.notes.filter(n => 
      new Date(n.timestamp).toDateString() === selectedDate.toDateString()
    ).length,
  };

  const stats = [
    {
      title: 'Voice Interactions',
      value: todayStats.voiceInteractions,
      icon: Mic,
      color: 'from-primary to-accent',
    },
    {
      title: 'Images Captured',
      value: todayStats.imagesCaptured,
      icon: Image,
      color: 'from-tech-glow to-tech-glow-secondary',
    },
    {
      title: 'Faces Recognized',
      value: todayStats.facesRecognized,
      icon: Users,
      color: 'from-accent to-primary',
    },
    {
      title: 'Notes Created',
      value: todayStats.notesCreated,
      icon: FileText,
      color: 'from-tech-glow-secondary to-primary',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Dashboard</h1>
          <p className="text-muted-foreground">Track your LifeOS activity and insights</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <Card key={i} className="glass-card border-0">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedDate.toDateString()}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Calendar and Recent Activity */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
              />
            </CardContent>
          </Card>

          <Card className="glass-card border-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {state.voiceInputs.slice(0, 5).map((input) => (
                  <div key={input.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Mic className="w-5 h-5 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm">{input.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(input.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {state.voiceInputs.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">
                    No activity yet. Start using your LifeOS glasses!
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
