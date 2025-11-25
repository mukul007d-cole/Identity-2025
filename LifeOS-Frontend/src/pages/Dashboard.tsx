import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Mic, Image, Users, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
// Removed useApp as we are fetching real data now, or you can keep it if needed for other global state
// import { useApp } from '@/contexts/AppContext'; 

const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // State for real data
  const [statsData, setStatsData] = useState({
    voiceInteractions: 0,
    imagesCaptured: 0,
    facesRecognized: 0,
    notesCreated: 0
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/stats?date=${selectedDate.toISOString()}`);
        const data = await response.json();

        if (data && data.counts) {
          setStatsData(data.counts);
          setRecentLogs(data.recentActivity || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDate]); // Re-run when date changes

  const stats = [
    {
      title: 'Voice Interactions',
      value: statsData.voiceInteractions,
      icon: Mic,
      color: 'from-primary to-accent',
    },
    {
      title: 'Images Captured',
      value: statsData.imagesCaptured,
      icon: Image,
      color: 'from-tech-glow to-tech-glow-secondary',
    },
    {
      title: 'Faces Recognized',
      value: statsData.facesRecognized,
      icon: Users,
      color: 'from-accent to-primary',
    },
    {
      title: 'Notes Created',
      value: statsData.notesCreated,
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
                  <div className="text-3xl font-bold">
                    {loading ? "..." : stat.value}
                  </div>
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
                {recentLogs.map((input) => (
                  <div key={input._id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Mic className="w-5 h-5 text-primary mt-1" />
                    <div className="flex-1">
                      <p className="text-sm">{input.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(input.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
                {!loading && recentLogs.length === 0 && (
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