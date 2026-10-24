// Gegenereerd uit het Supabase-schema; bijwerken na elke migratie.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      alarms: {
        Row: {
          aan: boolean;
          created_at: string;
          dagen: number[];
          doelen: Json;
          feestdagen_overslaan: boolean;
          id: string;
          naam: string;
          niveau: string;
          oefeningen: string[];
          overslaan_op: string | null;
          tijd: string;
          updated_at: string;
          user_id: string;
          wisselend: boolean;
        };
        Insert: {
          aan?: boolean;
          created_at?: string;
          dagen: number[];
          doelen?: Json;
          feestdagen_overslaan?: boolean;
          id?: string;
          naam?: string;
          niveau: string;
          oefeningen: string[];
          overslaan_op?: string | null;
          tijd: string;
          updated_at?: string;
          user_id?: string;
          wisselend?: boolean;
        };
        Update: {
          aan?: boolean;
          created_at?: string;
          dagen?: number[];
          doelen?: Json;
          feestdagen_overslaan?: boolean;
          id?: string;
          naam?: string;
          niveau?: string;
          oefeningen?: string[];
          overslaan_op?: string | null;
          tijd?: string;
          updated_at?: string;
          user_id?: string;
          wisselend?: boolean;
        };
        Relationships: [];
      };
      eigen_missies: {
        Row: {
          created_at: string;
          duur_seconden: number;
          emoji: string;
          id: string;
          naam: string;
          soort: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          duur_seconden?: number;
          emoji?: string;
          id?: string;
          naam: string;
          soort: string;
          user_id?: string;
        };
        Update: {
          created_at?: string;
          duur_seconden?: number;
          emoji?: string;
          id?: string;
          naam?: string;
          soort?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      feedback: {
        Row: {
          appversie: string | null;
          created_at: string;
          id: string;
          soort: string;
          tekst: string;
          toestel: string | null;
          user_id: string;
        };
        Insert: {
          appversie?: string | null;
          created_at?: string;
          id?: string;
          soort: string;
          tekst: string;
          toestel?: string | null;
          user_id?: string;
        };
        Update: {
          appversie?: string | null;
          created_at?: string;
          id?: string;
          soort?: string;
          tekst?: string;
          toestel?: string | null;
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
          gevoel: number | null;
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
          gevoel?: number | null;
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
          gevoel?: number | null;
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
export type EigenMissieRij = Database['public']['Tables']['eigen_missies']['Row'];
