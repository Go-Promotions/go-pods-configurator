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
      configuration_items: {
        Insert: {
          category_name_snapshot?: string | null;
          configuration_id: string;
          option_id?: string | null;
          option_slug_snapshot: string;
          option_title_snapshot: string;
          price_snapshot: number;
          quantity?: number;
          sort_order?: number;
          weight_snapshot?: number;
        };
        Row: {
          category_name_snapshot: string | null;
          configuration_id: string;
          created_at: string;
          id: string;
          option_id: string | null;
          option_slug_snapshot: string;
          option_title_snapshot: string;
          price_snapshot: number;
          quantity: number;
          sort_order: number;
          updated_at: string;
          weight_snapshot: number;
        };
      };
      configurations: {
        Insert: {
          base_miro_snapshot: number;
          base_price_snapshot: number;
          currency_code?: string;
          model_id: string;
          option_weight_total_snapshot?: number;
          options_total_snapshot?: number;
          public_reference: string;
          status?: "draft" | "submitted";
          total_miro_snapshot: number;
          total_price_snapshot: number;
        };
        Row: {
          base_miro_snapshot: number;
          base_price_snapshot: number;
          created_at: string;
          currency_code: string;
          id: string;
          model_id: string;
          option_weight_total_snapshot: number;
          options_total_snapshot: number;
          public_reference: string;
          status: "draft" | "submitted";
          total_miro_snapshot: number;
          total_price_snapshot: number;
          updated_at: string;
        };
      };
      enquiries: {
        Insert: {
          configuration_id?: string | null;
          email: string;
          enquiry_type:
            | "general_enquiry"
            | "request_quote"
            | "proceed_to_order";
          marketing_consent?: boolean;
          name: string;
          notes?: string | null;
          phone: string;
          postcode?: string | null;
          source_medium?: string | null;
          source_name?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
          utm_term?: string | null;
        };
        Row: {
          configuration_id: string | null;
          created_at: string;
          email: string;
          enquiry_type:
            | "general_enquiry"
            | "request_quote"
            | "proceed_to_order";
          id: string;
          marketing_consent: boolean;
          name: string;
          notes: string | null;
          phone: string;
          postcode: string | null;
          source_medium: string | null;
          source_name: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
          utm_term: string | null;
        };
      };
      quiz_answer_model_scores: {
        Row: {
          answer_id: string;
          created_at: string;
          id: string;
          model_id: string;
          score: number;
          updated_at: string;
        };
      };
      quiz_answer_option_suggestions: {
        Row: {
          answer_id: string;
          created_at: string;
          id: string;
          note: string | null;
          option_id: string;
          priority: number;
          updated_at: string;
        };
      };
      quiz_answers: {
        Row: {
          answer_text: string;
          created_at: string;
          id: string;
          question_id: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
      };
      quiz_questions: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          question_text: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
      };
      model_specs: {
        Row: {
          created_at: string;
          id: string;
          icon_path: string | null;
          item_label: string;
          item_value: string;
          model_id: string;
          section_label: string;
          sort_order: number;
          updated_at: string;
        };
      };
      model_images: {
        Row: {
          alt_text: string;
          created_at: string;
          id: string;
          image_path: string;
          model_id: string;
          sort_order: number;
          updated_at: string;
        };
      };
      models: {
        Row: {
          active: boolean;
          availability:
            | "available"
            | "low_stock"
            | "sold_out"
            | "discontinued";
          base_miro: number;
          base_price: number;
          created_at: string;
          id: string;
          image_path: string | null;
          name: string;
          recommendation_eligible: boolean;
          selectable: boolean;
          short_description: string;
          slug: string;
          sort_order: number;
          updated_at: string;
        };
      };
      option_categories: {
        Row: {
          active: boolean;
          created_at: string;
          description: string;
          id: string;
          name: string;
          scope: "accessory" | "styling";
          slug: string;
          sort_order: number;
          updated_at: string;
        };
      };
      option_images: {
        Row: {
          alt_text: string;
          created_at: string;
          id: string;
          image_path: string;
          is_primary: boolean;
          option_id: string;
          sort_order: number;
          updated_at: string;
        };
      };
      option_model_compatibility: {
        Row: {
          created_at: string;
          model_id: string;
          option_id: string;
        };
      };
      option_model_inclusions: {
        Row: {
          created_at: string;
          model_id: string;
          option_id: string;
        };
      };
      option_package_inclusions: {
        Row: {
          created_at: string;
          included_option_id: string;
          package_option_id: string;
        };
      };
      options: {
        Row: {
          active: boolean;
          applies_to_all_models: boolean;
          category_id: string;
          created_at: string;
          full_description: string;
          id: string;
          price: number;
          primary_image_url: string | null;
          scope: "accessory" | "styling";
          short_description: string;
          slug: string;
          sort_order: number;
          title: string;
          updated_at: string;
          weight: number;
        };
      };
    };
  };
}
