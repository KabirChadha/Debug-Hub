export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrderStatus = 'submitted' | 'quote_ready' | 'in_progress' | 'proof_ready' | 'completed';
export type PaymentStatus = 'unquoted' | 'unpaid' | 'verifying' | 'pending_verification' | 'approved' | 'completed';
export type ServiceType = 'bug_fix' | 'custom_project';

export interface Database {
  public: {
    Tables: {
      orders: {
        Row: {
          id: string;
          order_code: string;
          contact_handle: string;
          tech_stack: string;
          issue_description: string;
          service_type?: ServiceType | null;
          project_title?: string | null;
          requirements?: string | null;
          quoted_price?: number | null;
          estimated_time?: string | null;
          status: OrderStatus;
          file_name: string | null;
          file_storage_path: string | null;
          file_url?: string | null;
          intake_file_path?: string | null;
          zip_storage_path: string | null;
          proof_video_url: string | null;
          fixed_zip_url: string | null;
          deliverable_url?: string | null;
          deliverable_storage_path?: string | null;
          deliverable_file_name?: string | null;
          is_paid?: boolean | null;
          user_id: string | null;
          user_email: string | null;
          utr_number: string | null;
          payment_status: PaymentStatus;
          created_at: string;
          updated_at?: string | null;
        };
        Insert: {
          id?: string;
          order_code?: string;
          contact_handle: string;
          tech_stack: string;
          issue_description: string;
          service_type?: ServiceType | null;
          project_title?: string | null;
          requirements?: string | null;
          quoted_price?: number | null;
          estimated_time?: string | null;
          status?: OrderStatus;
          file_name?: string | null;
          file_storage_path?: string | null;
          file_url?: string | null;
          intake_file_path?: string | null;
          zip_storage_path?: string | null;
          proof_video_url?: string | null;
          fixed_zip_url?: string | null;
          deliverable_url?: string | null;
          deliverable_storage_path?: string | null;
          deliverable_file_name?: string | null;
          is_paid?: boolean | null;
          user_id?: string | null;
          user_email?: string | null;
          utr_number?: string | null;
          payment_status?: PaymentStatus;
          created_at?: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          order_code?: string;
          contact_handle?: string;
          tech_stack?: string;
          issue_description?: string;
          service_type?: ServiceType | null;
          project_title?: string | null;
          requirements?: string | null;
          quoted_price?: number | null;
          estimated_time?: string | null;
          status?: OrderStatus;
          file_name?: string | null;
          file_storage_path?: string | null;
          file_url?: string | null;
          intake_file_path?: string | null;
          zip_storage_path?: string | null;
          proof_video_url?: string | null;
          fixed_zip_url?: string | null;
          deliverable_url?: string | null;
          deliverable_storage_path?: string | null;
          deliverable_file_name?: string | null;
          is_paid?: boolean | null;
          user_id?: string | null;
          user_email?: string | null;
          utr_number?: string | null;
          payment_status?: PaymentStatus;
          created_at?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_order_by_code: {
        Args: {
          p_order_code: string;
        };
        Returns: {
          id: string;
          order_code: string;
          contact_handle: string;
          tech_stack: string;
          issue_description: string;
          quoted_price?: number | null;
          estimated_time?: string | null;
          status: OrderStatus;
          file_name: string | null;
          file_storage_path: string | null;
          file_url?: string | null;
          intake_file_path?: string | null;
          zip_storage_path: string | null;
          proof_video_url: string | null;
          fixed_zip_url: string | null;
          deliverable_url?: string | null;
          deliverable_storage_path?: string | null;
          deliverable_file_name?: string | null;
          is_paid?: boolean | null;
          user_id: string | null;
          user_email: string | null;
          utr_number: string | null;
          payment_status: PaymentStatus;
          created_at: string;
        }[];
      };
    };
    Enums: {
      order_status: OrderStatus;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Order = Database['public']['Tables']['orders']['Row'];
export type InsertOrder = Database['public']['Tables']['orders']['Insert'];
export type UpdateOrder = Database['public']['Tables']['orders']['Update'];

