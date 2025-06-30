import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please set up your Supabase project.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      quizzes: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          is_published: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
          total_questions: number;
          total_attempts: number;
          average_score: number;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          is_published?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          total_questions?: number;
          total_attempts?: number;
          average_score?: number;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          is_published?: boolean;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          total_questions?: number;
          total_attempts?: number;
          average_score?: number;
        };
      };
      questions: {
        Row: {
          id: string;
          quiz_id: string;
          question_text: string;
          question_type: string;
          options: string[];
          correct_answer: number;
          explanation: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          question_text: string;
          question_type?: string;
          options: string[];
          correct_answer: number;
          explanation?: string | null;
          order_index: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          question_text?: string;
          question_type?: string;
          options?: string[];
          correct_answer?: number;
          explanation?: string | null;
          order_index?: number;
          created_at?: string;
        };
      };
      quiz_attempts: {
        Row: {
          id: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          time_taken: number;
          answers: Record<string, number>;
          completed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          quiz_id: string;
          user_id: string;
          score: number;
          total_questions: number;
          time_taken: number;
          answers: Record<string, number>;
          completed_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          quiz_id?: string;
          user_id?: string;
          score?: number;
          total_questions?: number;
          time_taken?: number;
          answers?: Record<string, number>;
          completed_at?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};