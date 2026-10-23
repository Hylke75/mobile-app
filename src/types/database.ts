// Gegenereerd uit het Supabase-schema; bijwerken na elke migratie.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
          voornaam: string | null;
        };
        Insert: {
          created_at?: string;
          id: string;
          updated_at?: string;
          voornaam?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
          voornaam?: string | null;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Profiel = Database['public']['Tables']['profiles']['Row'];
