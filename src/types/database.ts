// Gegenereerd uit het Supabase-schema; bijwerken na elke migratie.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      alarms: {
        Row: {
          aan: boolean;
          created_at: string;
          dagen: number[];
          doelen: Json;
          id: string;
          naam: string;
          niveau: string;
          oefeningen: string[];
          tijd: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          aan?: boolean;
          created_at?: string;
          dagen: number[];
          doelen?: Json;
          id?: string;
          naam?: string;
          niveau: string;
          oefeningen: string[];
          tijd: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          aan?: boolean;
          created_at?: string;
          dagen?: number[];
          doelen?: Json;
          id?: string;
          naam?: string;
          niveau?: string;
          oefeningen?: string[];
          tijd?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      missie_sessies: {
        Row: {
          afgerond_op: string;
          alarm_id: string | null;
          created_at: string;
          gestart_op: string;
          id: string;
          stappen: Json;
          status: string;
          totaal_herhalingen: number;
          user_id: string;
        };
        Insert: {
          afgerond_op?: string;
          alarm_id?: string | null;
          created_at?: string;
          gestart_op: string;
          id?: string;
          stappen?: Json;
          status: string;
          totaal_herhalingen?: number;
          user_id?: string;
        };
        Update: {
          afgerond_op?: string;
          alarm_id?: string | null;
          created_at?: string;
          gestart_op?: string;
          id?: string;
          stappen?: Json;
          status?: string;
          totaal_herhalingen?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'missie_sessies_alarm_id_fkey';
            columns: ['alarm_id'];
            isOneToOne: false;
            referencedRelation: 'alarms';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          alarmtest_geslaagd_op: string | null;
          created_at: string;
          id: string;
          pauze_tot: string | null;
          updated_at: string;
          voornaam: string | null;
          weekdoel: number;
        };
        Insert: {
          alarmtest_geslaagd_op?: string | null;
          created_at?: string;
          id: string;
          pauze_tot?: string | null;
          updated_at?: string;
          voornaam?: string | null;
          weekdoel?: number;
        };
        Update: {
          alarmtest_geslaagd_op?: string | null;
          created_at?: string;
          id?: string;
          pauze_tot?: string | null;
          updated_at?: string;
          voornaam?: string | null;
          weekdoel?: number;
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
export type AlarmRij = Database['public']['Tables']['alarms']['Row'];
export type SessieRij = Database['public']['Tables']['missie_sessies']['Row'];
