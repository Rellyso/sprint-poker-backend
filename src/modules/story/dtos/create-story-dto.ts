export interface CreateStoryDTO {
  name: string;
  code: string;
  link?: string;
  description?: string;
  sessionToken: string;
}