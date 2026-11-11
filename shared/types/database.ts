export type QuizVisibility = 'private' | 'link' | 'public';
export type PointsMode = 'standard' | 'double' | 'none';
export type SelectMode = 'single' | 'multi';

export interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  preferred_locale: 'en' | 'es';
  created_at: string;
  updated_at: string;
}

export interface FolderRow {
  id: string;
  owner_id: string;
  name: string;
  created_at: string;
}

export interface QuizRow {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  visibility: QuizVisibility;
  theme_id: string;
  cover_image_url: string | null;
  language: string;
  music_preset: string;
  is_valid: boolean;
  is_published: boolean;
  tags: string[];
  subject: string;
  folder_id?: string | null;
  is_favourite?: boolean;
  created_at: string;
  updated_at: string;
}

export interface SlideRow {
  id: string;
  quiz_id: string;
  position: number;
  type: string;
  title: string;
  media_url: string | null;
  media_reveal: boolean;
  time_limit: number;
  points_mode: PointsMode;
  select_mode: SelectMode;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MediaAssetRow {
  id: string;
  owner_id: string;
  storage_path: string;
  public_url: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

