import React, { createContext, useContext, useState, useEffect } from 'react';

interface UserDetails {
  name: string;
  email: string;
  deviceConnected: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  imageUrl?: string;
}

interface SavedImage {
  id: string;
  url: string;
  timestamp: Date;
  description?: string;
}

interface SavedFace {
  id: string;
  name: string;
  imageUrl: string;
  timestamp: Date;
}

interface Note {
  id: string;
  content: string;
  timestamp: Date;
}

interface VoiceInput {
  id: string;
  text: string;
  timestamp: Date;
  intent?: string;
}

interface DashboardData {
  date: Date;
  voiceInteractions: number;
  imagesCaptures: number;
  facesRecognized: number;
  notesCreated: number;
}

interface AppState {
  userDetails: UserDetails;
  savedImages: SavedImage[];
  savedFaces: SavedFace[];
  notes: Note[];
  voiceInputs: VoiceInput[];
  dashboardData: DashboardData[];
  messages: Message[];
  isConnecting: boolean;
  theme: 'light' | 'dark';
  permissions: {
    camera: boolean;
    microphone: boolean;
    location: boolean;
    notifications: boolean;
  };
}

interface AppContextType {
  state: AppState;
  updateUserDetails: (details: Partial<UserDetails>) => void;
  addImage: (image: Omit<SavedImage, 'id' | 'timestamp'>) => void;
  addFace: (face: Omit<SavedFace, 'id' | 'timestamp'>) => void;
  addNote: (content: string) => void;
  addVoiceInput: (input: Omit<VoiceInput, 'id' | 'timestamp'>) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setConnecting: (isConnecting: boolean) => void;
  updatePermission: (permission: keyof AppState['permissions'], value: boolean) => void;
  toggleTheme: () => void;
  getDashboardDataByDate: (date: Date) => DashboardData | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('lifeos-state');
    return saved ? JSON.parse(saved) : {
      userDetails: {
        name: '',
        email: '',
        deviceConnected: false,
      },
      savedImages: [],
      savedFaces: [],
      notes: [],
      voiceInputs: [],
      dashboardData: [],
      messages: [],
      isConnecting: false,
      theme: 'dark',
      permissions: {
        camera: false,
        microphone: false,
        location: false,
        notifications: false,
      },
    };
  });

  useEffect(() => {
    localStorage.setItem('lifeos-state', JSON.stringify(state));
    document.documentElement.classList.toggle('dark', state.theme === 'dark');
  }, [state]);

  const updateUserDetails = (details: Partial<UserDetails>) => {
    setState(prev => ({
      ...prev,
      userDetails: { ...prev.userDetails, ...details }
    }));
  };

  const addImage = (image: Omit<SavedImage, 'id' | 'timestamp'>) => {
    const newImage: SavedImage = {
      ...image,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      savedImages: [newImage, ...prev.savedImages]
    }));
  };

  const addFace = (face: Omit<SavedFace, 'id' | 'timestamp'>) => {
    const newFace: SavedFace = {
      ...face,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      savedFaces: [newFace, ...prev.savedFaces]
    }));
  };

  const addNote = (content: string) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      notes: [newNote, ...prev.notes]
    }));
  };

  const addVoiceInput = (input: Omit<VoiceInput, 'id' | 'timestamp'>) => {
    const newInput: VoiceInput = {
      ...input,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      voiceInputs: [newInput, ...prev.voiceInputs]
    }));
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };
    setState(prev => ({
      ...prev,
      messages: [newMessage, ...prev.messages]
    }));
  };

  const setConnecting = (isConnecting: boolean) => {
    setState(prev => ({
      ...prev,
      isConnecting
    }));
  };

  const updatePermission = (permission: keyof AppState['permissions'], value: boolean) => {
    setState(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: value
      }
    }));
  };

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark'
    }));
  };

  const getDashboardDataByDate = (date: Date) => {
    return state.dashboardData.find(data => 
      new Date(data.date).toDateString() === date.toDateString()
    );
  };

  return (
    <AppContext.Provider value={{
      state,
      updateUserDetails,
      addImage,
      addFace,
      addNote,
      addVoiceInput,
      addMessage,
      setConnecting,
      updatePermission,
      toggleTheme,
      getDashboardDataByDate,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
