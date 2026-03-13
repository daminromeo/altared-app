export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          partner_name: string | null;
          wedding_name: string | null;
          wedding_date: string | null;
          wedding_location: string | null;
          estimated_guest_count: number | null;
          total_budget: number | null;
          avatar_url: string | null;
          stripe_customer_id: string | null;
          subscription_status: string;
          subscription_id: string | null;
          onboarding_completed: boolean;
          notification_preferences: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          partner_name?: string | null;
          wedding_name?: string | null;
          wedding_date?: string | null;
          wedding_location?: string | null;
          estimated_guest_count?: number | null;
          total_budget?: number | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          subscription_id?: string | null;
          onboarding_completed?: boolean;
          notification_preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          partner_name?: string | null;
          wedding_name?: string | null;
          wedding_date?: string | null;
          wedding_location?: string | null;
          estimated_guest_count?: number | null;
          total_budget?: number | null;
          avatar_url?: string | null;
          stripe_customer_id?: string | null;
          subscription_status?: string;
          subscription_id?: string | null;
          onboarding_completed?: boolean;
          notification_preferences?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      vendor_categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          default_budget_percentage: number | null;
          sort_order: number;
        };
        Insert: {
          id?: string;
          name: string;
          icon?: string | null;
          default_budget_percentage?: number | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          name?: string;
          icon?: string | null;
          default_budget_percentage?: number | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      vendors: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          name: string;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          website: string | null;
          instagram: string | null;
          source: string | null;
          source_url: string | null;
          status: string;
          rating: number | null;
          notes: string | null;
          quoted_price: number | null;
          final_price: number | null;
          deposit_amount: number | null;
          deposit_due_date: string | null;
          deposit_paid: boolean;
          is_booked: boolean;
          booked_date: string | null;
          tags: string[] | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          name: string;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          instagram?: string | null;
          source?: string | null;
          source_url?: string | null;
          status?: string;
          rating?: number | null;
          notes?: string | null;
          quoted_price?: number | null;
          final_price?: number | null;
          deposit_amount?: number | null;
          deposit_due_date?: string | null;
          deposit_paid?: boolean;
          is_booked?: boolean;
          booked_date?: string | null;
          tags?: string[] | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          name?: string;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          website?: string | null;
          instagram?: string | null;
          source?: string | null;
          source_url?: string | null;
          status?: string;
          rating?: number | null;
          notes?: string | null;
          quoted_price?: number | null;
          final_price?: number | null;
          deposit_amount?: number | null;
          deposit_due_date?: string | null;
          deposit_paid?: boolean;
          is_booked?: boolean;
          booked_date?: string | null;
          tags?: string[] | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "vendors_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendors_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "vendor_categories";
            referencedColumns: ["id"];
          }
        ];
      };
      proposals: {
        Row: {
          id: string;
          user_id: string;
          vendor_id: string | null;
          file_url: string;
          file_name: string;
          file_size: number | null;
          scan_status: string;
          scanned_data: Json;
          extracted_vendor_name: string | null;
          extracted_total_price: number | null;
          extracted_deposit_amount: number | null;
          extracted_deposit_due_date: string | null;
          extracted_payment_schedule: Json | null;
          extracted_services: string[] | null;
          extracted_terms: string | null;
          extracted_cancellation_policy: string | null;
          extracted_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vendor_id?: string | null;
          file_url: string;
          file_name: string;
          file_size?: number | null;
          scan_status?: string;
          scanned_data?: Json;
          extracted_vendor_name?: string | null;
          extracted_total_price?: number | null;
          extracted_deposit_amount?: number | null;
          extracted_deposit_due_date?: string | null;
          extracted_payment_schedule?: Json | null;
          extracted_services?: string[] | null;
          extracted_terms?: string | null;
          extracted_cancellation_policy?: string | null;
          extracted_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vendor_id?: string | null;
          file_url?: string;
          file_name?: string;
          file_size?: number | null;
          scan_status?: string;
          scanned_data?: Json;
          extracted_vendor_name?: string | null;
          extracted_total_price?: number | null;
          extracted_deposit_amount?: number | null;
          extracted_deposit_due_date?: string | null;
          extracted_payment_schedule?: Json | null;
          extracted_services?: string[] | null;
          extracted_terms?: string | null;
          extracted_cancellation_policy?: string | null;
          extracted_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "proposals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "proposals_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          }
        ];
      };
      budget_items: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          vendor_id: string | null;
          description: string;
          estimated_cost: number;
          actual_cost: number;
          is_paid: boolean;
          paid_date: string | null;
          due_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          vendor_id?: string | null;
          description: string;
          estimated_cost?: number;
          actual_cost?: number;
          is_paid?: boolean;
          paid_date?: string | null;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          vendor_id?: string | null;
          description?: string;
          estimated_cost?: number;
          actual_cost?: number;
          is_paid?: boolean;
          paid_date?: string | null;
          due_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_items_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "vendor_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_items_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          vendor_id: string | null;
          source: string;
          direction: string;
          subject: string | null;
          body: string | null;
          sender_email: string | null;
          sender_name: string | null;
          received_at: string;
          is_read: boolean;
          is_starred: boolean;
          thread_id: string | null;
          external_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vendor_id?: string | null;
          source: string;
          direction: string;
          subject?: string | null;
          body?: string | null;
          sender_email?: string | null;
          sender_name?: string | null;
          received_at?: string;
          is_read?: boolean;
          is_starred?: boolean;
          thread_id?: string | null;
          external_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vendor_id?: string | null;
          source?: string;
          direction?: string;
          subject?: string | null;
          body?: string | null;
          sender_email?: string | null;
          sender_name?: string | null;
          received_at?: string;
          is_read?: boolean;
          is_starred?: boolean;
          thread_id?: string | null;
          external_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          }
        ];
      };
      reminders: {
        Row: {
          id: string;
          user_id: string;
          vendor_id: string | null;
          title: string;
          description: string | null;
          due_date: string;
          is_completed: boolean;
          reminder_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          vendor_id?: string | null;
          title: string;
          description?: string | null;
          due_date: string;
          is_completed?: boolean;
          reminder_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          vendor_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string;
          is_completed?: boolean;
          reminder_type?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reminders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reminders_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          }
        ];
      };
      partner_share_links: {
        Row: {
          id: string;
          user_id: string;
          token: string;
          partner_name: string | null;
          is_active: boolean;
          expires_at: string | null;
          last_accessed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          token: string;
          partner_name?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          last_accessed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          token?: string;
          partner_name?: string | null;
          is_active?: boolean;
          expires_at?: string | null;
          last_accessed_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_share_links_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      partner_reactions: {
        Row: {
          id: string;
          share_link_id: string;
          vendor_id: string;
          partner_name: string;
          reaction: string;
          comment: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          share_link_id: string;
          vendor_id: string;
          partner_name: string;
          reaction: string;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          share_link_id?: string;
          vendor_id?: string;
          partner_name?: string;
          reaction?: string;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "partner_reactions_share_link_id_fkey";
            columns: ["share_link_id"];
            isOneToOne: false;
            referencedRelation: "partner_share_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "partner_reactions_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendors";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
