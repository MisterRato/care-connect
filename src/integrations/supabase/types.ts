export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      notificacoes_violencia: {
        Row: {
          circunstancia_lesao: string | null
          created_at: string
          created_by: string | null
          data_notificacao: string
          data_ocorrencia: string | null
          id: string
          payload: Json
          profissional_id: string | null
          status: Database["public"]["Enums"]["notificacao_status"]
          unidade_notificadora_id: string | null
          unidade_saude_id: string | null
          updated_at: string
          usuario_sus_id: string
        }
        Insert: {
          circunstancia_lesao?: string | null
          created_at?: string
          created_by?: string | null
          data_notificacao?: string
          data_ocorrencia?: string | null
          id?: string
          payload?: Json
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["notificacao_status"]
          unidade_notificadora_id?: string | null
          unidade_saude_id?: string | null
          updated_at?: string
          usuario_sus_id: string
        }
        Update: {
          circunstancia_lesao?: string | null
          created_at?: string
          created_by?: string | null
          data_notificacao?: string
          data_ocorrencia?: string | null
          id?: string
          payload?: Json
          profissional_id?: string | null
          status?: Database["public"]["Enums"]["notificacao_status"]
          unidade_notificadora_id?: string | null
          unidade_saude_id?: string | null
          updated_at?: string
          usuario_sus_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notificacoes_violencia_profissional_id_fkey"
            columns: ["profissional_id"]
            isOneToOne: false
            referencedRelation: "profissionais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_violencia_unidade_notificadora_id_fkey"
            columns: ["unidade_notificadora_id"]
            isOneToOne: false
            referencedRelation: "unidades_notificadoras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_violencia_unidade_saude_id_fkey"
            columns: ["unidade_saude_id"]
            isOneToOne: false
            referencedRelation: "unidades_saude"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notificacoes_violencia_usuario_sus_id_fkey"
            columns: ["usuario_sus_id"]
            isOneToOne: false
            referencedRelation: "usuarios_sus"
            referencedColumns: ["id"]
          },
        ]
      }
      profissionais: {
        Row: {
          cbo: string | null
          cns: string | null
          conselho_classe: string | null
          cpf: string | null
          created_at: string
          data_admissao: string | null
          dt_nascimento: string | null
          email: string | null
          id: string
          nome: string
          numero_conselho: string | null
          ocupacao: string | null
          sexo: string | null
          telefone: string | null
          uf_conselho: string | null
          unidade_saude_id: string | null
          user_id: string | null
        }
        Insert: {
          cbo?: string | null
          cns?: string | null
          conselho_classe?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          dt_nascimento?: string | null
          email?: string | null
          id?: string
          nome: string
          numero_conselho?: string | null
          ocupacao?: string | null
          sexo?: string | null
          telefone?: string | null
          uf_conselho?: string | null
          unidade_saude_id?: string | null
          user_id?: string | null
        }
        Update: {
          cbo?: string | null
          cns?: string | null
          conselho_classe?: string | null
          cpf?: string | null
          created_at?: string
          data_admissao?: string | null
          dt_nascimento?: string | null
          email?: string | null
          id?: string
          nome?: string
          numero_conselho?: string | null
          ocupacao?: string | null
          sexo?: string | null
          telefone?: string | null
          uf_conselho?: string | null
          unidade_saude_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profissionais_unidade_saude_id_fkey"
            columns: ["unidade_saude_id"]
            isOneToOne: false
            referencedRelation: "unidades_saude"
            referencedColumns: ["id"]
          },
        ]
      }
      unidades_notificadoras: {
        Row: {
          created_at: string
          id: string
          nome: string
          tipo: number
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          tipo: number
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          tipo?: number
        }
        Relationships: []
      }
      unidades_saude: {
        Row: {
          bairro: string | null
          cep: string | null
          cnes: string | null
          cnpj: string | null
          cod_ibge: string | null
          codigo_unidade: string | null
          complemento: string | null
          created_at: string
          distrito: string | null
          email: string | null
          equipe: string | null
          esfera_administrativa: string | null
          gestao: string | null
          horario_funcionamento: string | null
          id: string
          logradouro: string | null
          municipio: string | null
          nivel_atencao: string | null
          nome: string
          numero: string | null
          ponto_referencia: string | null
          subtipo: string | null
          telefone: string | null
          tipo_unidade: string | null
          uf: string | null
        }
        Insert: {
          bairro?: string | null
          cep?: string | null
          cnes?: string | null
          cnpj?: string | null
          cod_ibge?: string | null
          codigo_unidade?: string | null
          complemento?: string | null
          created_at?: string
          distrito?: string | null
          email?: string | null
          equipe?: string | null
          esfera_administrativa?: string | null
          gestao?: string | null
          horario_funcionamento?: string | null
          id?: string
          logradouro?: string | null
          municipio?: string | null
          nivel_atencao?: string | null
          nome: string
          numero?: string | null
          ponto_referencia?: string | null
          subtipo?: string | null
          telefone?: string | null
          tipo_unidade?: string | null
          uf?: string | null
        }
        Update: {
          bairro?: string | null
          cep?: string | null
          cnes?: string | null
          cnpj?: string | null
          cod_ibge?: string | null
          codigo_unidade?: string | null
          complemento?: string | null
          created_at?: string
          distrito?: string | null
          email?: string | null
          equipe?: string | null
          esfera_administrativa?: string | null
          gestao?: string | null
          horario_funcionamento?: string | null
          id?: string
          logradouro?: string | null
          municipio?: string | null
          nivel_atencao?: string | null
          nome?: string
          numero?: string | null
          ponto_referencia?: string | null
          subtipo?: string | null
          telefone?: string | null
          tipo_unidade?: string | null
          uf?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          unidade_saude_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          unidade_saude_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          unidade_saude_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usuarios_sus: {
        Row: {
          abastecimento_agua: string | null
          area: string | null
          bairro: string | null
          cep: string | null
          cns: string | null
          cod_ibge_municipio: string | null
          complemento: string | null
          cpf: string | null
          created_at: string
          data_cadastro_psf: string | null
          deficiencia_outra: string | null
          deficiencia_tipos: Json | null
          destino_lixo: string | null
          distrito: string | null
          dpp: string | null
          dt_nascimento: string | null
          dum: string | null
          energia_eletrica: string | null
          equipe: string | null
          escoamento_sanitario: string | null
          escolaridade: string | null
          estado_civil: string | null
          id: string
          idade_gestacional: number | null
          identidade_genero: string | null
          logradouro: string | null
          material_parede: string | null
          micro_area: string | null
          municipio: string | null
          nome: string
          nome_mae: string | null
          nome_social: string | null
          num_comodos: number | null
          num_consultas_prenatal: number | null
          num_moradores: number | null
          numero: string | null
          numero_prontuario: string | null
          ocupacao: string | null
          ocupacao_cbo: string | null
          orientacao_sexual: string | null
          passaporte: string | null
          ponto_referencia: string | null
          raca: string | null
          rg: string | null
          rg_orgao_emissor: string | null
          rg_uf: string | null
          sexo: string | null
          situacao_mercado_trabalho: string | null
          telefone: string | null
          tem_deficiencia: boolean | null
          tempo_servico: string | null
          tipo_domicilio: string | null
          tratamento_agua: string | null
          uf: string | null
          unidade_saude_id: string | null
          vinculo_trabalho: string | null
        }
        Insert: {
          abastecimento_agua?: string | null
          area?: string | null
          bairro?: string | null
          cep?: string | null
          cns?: string | null
          cod_ibge_municipio?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          data_cadastro_psf?: string | null
          deficiencia_outra?: string | null
          deficiencia_tipos?: Json | null
          destino_lixo?: string | null
          distrito?: string | null
          dpp?: string | null
          dt_nascimento?: string | null
          dum?: string | null
          energia_eletrica?: string | null
          equipe?: string | null
          escoamento_sanitario?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          id?: string
          idade_gestacional?: number | null
          identidade_genero?: string | null
          logradouro?: string | null
          material_parede?: string | null
          micro_area?: string | null
          municipio?: string | null
          nome: string
          nome_mae?: string | null
          nome_social?: string | null
          num_comodos?: number | null
          num_consultas_prenatal?: number | null
          num_moradores?: number | null
          numero?: string | null
          numero_prontuario?: string | null
          ocupacao?: string | null
          ocupacao_cbo?: string | null
          orientacao_sexual?: string | null
          passaporte?: string | null
          ponto_referencia?: string | null
          raca?: string | null
          rg?: string | null
          rg_orgao_emissor?: string | null
          rg_uf?: string | null
          sexo?: string | null
          situacao_mercado_trabalho?: string | null
          telefone?: string | null
          tem_deficiencia?: boolean | null
          tempo_servico?: string | null
          tipo_domicilio?: string | null
          tratamento_agua?: string | null
          uf?: string | null
          unidade_saude_id?: string | null
          vinculo_trabalho?: string | null
        }
        Update: {
          abastecimento_agua?: string | null
          area?: string | null
          bairro?: string | null
          cep?: string | null
          cns?: string | null
          cod_ibge_municipio?: string | null
          complemento?: string | null
          cpf?: string | null
          created_at?: string
          data_cadastro_psf?: string | null
          deficiencia_outra?: string | null
          deficiencia_tipos?: Json | null
          destino_lixo?: string | null
          distrito?: string | null
          dpp?: string | null
          dt_nascimento?: string | null
          dum?: string | null
          energia_eletrica?: string | null
          equipe?: string | null
          escoamento_sanitario?: string | null
          escolaridade?: string | null
          estado_civil?: string | null
          id?: string
          idade_gestacional?: number | null
          identidade_genero?: string | null
          logradouro?: string | null
          material_parede?: string | null
          micro_area?: string | null
          municipio?: string | null
          nome?: string
          nome_mae?: string | null
          nome_social?: string | null
          num_comodos?: number | null
          num_consultas_prenatal?: number | null
          num_moradores?: number | null
          numero?: string | null
          numero_prontuario?: string | null
          ocupacao?: string | null
          ocupacao_cbo?: string | null
          orientacao_sexual?: string | null
          passaporte?: string | null
          ponto_referencia?: string | null
          raca?: string | null
          rg?: string | null
          rg_orgao_emissor?: string | null
          rg_uf?: string | null
          sexo?: string | null
          situacao_mercado_trabalho?: string | null
          telefone?: string | null
          tem_deficiencia?: boolean | null
          tempo_servico?: string | null
          tipo_domicilio?: string | null
          tratamento_agua?: string | null
          uf?: string | null
          unidade_saude_id?: string | null
          vinculo_trabalho?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_sus_unidade_saude_id_fkey"
            columns: ["unidade_saude_id"]
            isOneToOne: false
            referencedRelation: "unidades_saude"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "ubs" | "epidemiologia"
      notificacao_status: "ubs" | "epi" | "encerrada"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "ubs", "epidemiologia"],
      notificacao_status: ["ubs", "epi", "encerrada"],
    },
  },
} as const
