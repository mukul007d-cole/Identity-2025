import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Mail, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const Help = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Support request submitted! We\'ll get back to you soon.');
  };

  const faqs = [
    {
      question: 'How do I connect my LifeOS glasses?',
      answer: 'Go to the Connect page and choose your preferred connection method (Bluetooth, Wi-Fi, or USB). Follow the on-screen instructions to pair your device.',
    },
    {
      question: 'What does "Hey Glasses" wake word do?',
      answer: 'The wake word activates the voice assistant. Once you say "Hey Glasses", the system will start listening for your command and send it to the backend for processing.',
    },
    {
      question: 'How do I capture photos with my glasses?',
      answer: 'Navigate to the Camera page, start the camera feed, and click the Capture button. Photos are automatically saved to your local storage.',
    },
    {
      question: 'Can I use LifeOS offline?',
      answer: 'Basic features like camera capture work offline, but voice commands and AI features require an internet connection to process requests.',
    },
    {
      question: 'How do I manage my saved data?',
      answer: 'Go to Settings to view storage usage and manage your saved images, faces, notes, and voice inputs. You can also clear all data from the Danger Zone section.',
    },
    {
      question: 'What permissions does LifeOS need?',
      answer: 'LifeOS requires camera and microphone access for core features. Location and notifications are optional. Manage these in the Permissions page.',
    },
  ];

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 gradient-text">Help & Support</h1>
          <p className="text-muted-foreground">Get assistance with LifeOS</p>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-card border-0 hover:scale-105 transition-transform cursor-pointer">
            <CardContent className="p-6 text-center">
              <BookOpen className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Documentation</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Complete user guide
              </p>
              <Button variant="outline" size="sm">
                View Docs <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover:scale-105 transition-transform cursor-pointer">
            <CardContent className="p-6 text-center">
              <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Community</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Join discussions
              </p>
              <Button variant="outline" size="sm">
                Visit Forum <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-card border-0 hover:scale-105 transition-transform cursor-pointer">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                support@lifeos.dev
              </p>
              <Button variant="outline" size="sm">
                Send Email <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* FAQs */}
        <Card className="glass-card border-0 mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="glass-card border-0">
          <CardHeader>
            <CardTitle>Contact Support</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Subject</label>
                <Input placeholder="Brief description of your issue" required />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Message</label>
                <Textarea 
                  placeholder="Describe your issue in detail..." 
                  rows={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Submit Request
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Help;
