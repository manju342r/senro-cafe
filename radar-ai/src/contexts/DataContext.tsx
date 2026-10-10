import React, { createContext, useContext, ReactNode } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Define the shape of our data context
interface DataContextType {
  supabase: SupabaseClient;
  insertSignal: (signalData: SignalData) => Promise<void>;
  ingestToHindsight: (competitorId: string, summary: string) => Promise<void>;
  saveUserPreference: (userId: string, feedback: string) => Promise<void>;
  recallMemory: (competitorId: string, userId: string) => Promise<{ competitorContext: string, userContext: string }>;
}

export interface SignalData {
  user_id: string;
  competitor_id: string;
  type: 'Price' | 'Feature' | 'Messaging' | 'Hiring' | 'DOM';
  content: string;
}

// In a real app, these would come from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  
  // Sync Supabase user_metadata to localStorage on auth state change
  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user?.user_metadata) {
        const { ownUrl, compUrl } = session.user.user_metadata;
        if (ownUrl) localStorage.setItem('ownUrl', ownUrl);
        if (compUrl) localStorage.setItem('compUrl', compUrl);
      }
    });
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  
  // 1. Ingestion: Push summarized signal into Hindsight for the competitor
  const ingestToHindsight = async (competitorId: string, summary: string) => {
    try {
      console.log(`[Hindsight] Ingesting signal summary for competitor ${competitorId}:`, summary);
      // Example call to a hypothetical Vectorize Hindsight REST API
      // await fetch('https://api.vectorize.io/v1/hindsight/insert', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.HINDSIGHT_API_KEY}` },
      //   body: JSON.stringify({ namespace: `competitor-${competitorId}`, text: summary })
      // });
    } catch (error) {
      console.error('Error ingesting to Hindsight:', error);
    }
  };

  // 2. User Preference Memory: Push user feedback into user-scoped Hindsight
  const saveUserPreference = async (userId: string, feedback: string) => {
    try {
      console.log(`[Hindsight] Saving preference for user ${userId}:`, feedback);
      // await fetch('https://api.vectorize.io/v1/hindsight/insert', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.HINDSIGHT_API_KEY}` },
      //   body: JSON.stringify({ namespace: `user-prefs-${userId}`, text: feedback })
      // });
    } catch (error) {
      console.error('Error saving user preference:', error);
    }
  };

  // 3. Recall: Retrieve strategic evolution & formatting preferences
  const recallMemory = async (competitorId: string, userId: string) => {
    try {
      console.log(`[Hindsight] Recalling memory for competitor ${competitorId} and user ${userId}`);
      
      // Simulate fetching competitor's 6-month strategic evolution
      // const compRes = await fetch(`https://api.vectorize.io/v1/hindsight/query?namespace=competitor-${competitorId}&q=6-month strategic evolution`);
      const competitorContext = "Competitor shifted focus towards enterprise pricing and added AI features in the last 6 months.";

      // Simulate fetching user's formatting/industry preferences
      // const userRes = await fetch(`https://api.vectorize.io/v1/hindsight/query?namespace=user-prefs-${userId}&q=formatting and industry preferences`);
      const userContext = "User prefers short, bulleted summaries focusing on enterprise implications.";

      return { competitorContext, userContext };
    } catch (error) {
      console.error('Error recalling memory from Hindsight:', error);
      return { competitorContext: '', userContext: '' };
    }
  };

  // Supabase Mutation Wrapper
  const insertSignal = async (signalData: SignalData) => {
    // 1. Insert into Supabase
    const { data, error } = await supabase.from('signals').insert([signalData]);
    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }
    
    // 2. Automatically push a summarized version to Hindsight memory stream
    const summary = `Detected ${signalData.type} change: ${signalData.content.substring(0, 100)}`;
    await ingestToHindsight(signalData.competitor_id, summary);
  };

  return (
    <DataContext.Provider value={{ supabase, insertSignal, ingestToHindsight, saveUserPreference, recallMemory }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
