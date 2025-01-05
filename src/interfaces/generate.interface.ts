export interface SessionData {
  text: string;
  telegram_id: number;
}
export type ModelUrl = `${string}/${string}:${string}` | `${string}/${string}`;

export interface GenerationResult {
  image: string | Buffer;
  prompt_id: number;
}

export type ApiResponse = string | string[] | { output: string };

export interface ApiImageResponse {
  data: {
    image: string;
    prompt_id: string;
  };
  message: string;
}
