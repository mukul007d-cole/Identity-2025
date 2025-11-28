import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, NotebookPen } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      title: "Daily Reminder",
      content: "Finish LifeOS ESP32 camera integration + UI rendering test.",
      createdAt: "2025-11-26",
    },
    {
      id: "2",
      title: "Research: Agents",
      content: "Look into Autonomous Agents + MCP protocol. Test workflow chains.",
      createdAt: "2025-11-24",
    },
    {
      id: "3",
      title: "AI Presentation",
      content:
        "Prepare demo: Voice commands → backend logs → camera capture → response.",
      createdAt: "2025-11-20",
    },
    {
        id: "4",
        title: "Make a project Vlog",
        content: "Create a 3-5 mi vlog for Identity project",
        createdAt: "2025-11-23",
      },
      {
        id: "5",
        title: "Prepare for college vid",
        content:
          "Prepare the script for college vid the script is in whatsapp",
        createdAt: "2025-11-25",
      },
  ]);

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="min-h-screen pt-24 pb-12">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <NotebookPen className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold gradient-text">
              Notes
            </h1>
          </div>
          <p className="text-muted-foreground">
            All your saved notes from the LifeOS 
          </p>
        </div>

        {/* Notes List */}
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="glass-card border-0">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">
                    {note.title}
                  </CardTitle>

                  <button
                    onClick={() => deleteNote(note.id)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="pt-1 pb-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {note.content}
                </p>

                <p className="text-[12px] mt-3 text-muted-foreground/70">
                  📅 {note.createdAt}
                </p>
              </CardContent>
            </Card>
          ))}

          {notes.length === 0 && (
            <Card className="glass-card border-0">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">
                  No notes found. (All deleted)
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;
