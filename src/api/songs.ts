import type { CommentBody, Song, SongWithComments } from "../types";

const API_HOST = import.meta.env.VITE_API_HOST || "";

const getApiUrl = (path: string): string => {
  return `${API_HOST}${path}`;
};

export const songsApi = {
  /**
   * Fetch all songs
   */
  async list(): Promise<Song[]> {
    const response = await fetch(getApiUrl("/d/list"));
    if (!response.ok) {
      throw new Error(`Failed to fetch songs: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Fetch a single song by ID (with comments)
   */
  async getById(id: number): Promise<SongWithComments> {
    const response = await fetch(getApiUrl(`/d/${id}`));
    if (!response.ok) {
      throw new Error(`Failed to fetch song: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Upvote a song (updates are received via WebSocket)
   */
  async upvote(id: number): Promise<void> {
    const response = await fetch(getApiUrl(`/d/${id}/up`), {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Failed to upvote: ${response.statusText}`);
    }
  },

  /**
   * Downvote a song (updates are received via WebSocket)
   */
  async downvote(id: number): Promise<void> {
    const response = await fetch(getApiUrl(`/d/${id}/down`), {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(`Failed to downvote: ${response.statusText}`);
    }
  },

  /**
   * Add a comment to a song (updates are received via WebSocket)
   */
  async comment(id: number, text: string): Promise<void> {
    const response = await fetch(getApiUrl(`/d/${id}/comment`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text } satisfies CommentBody),
    });
    if (!response.ok) {
      throw new Error(`Failed to add comment: ${response.statusText}`);
    }
  },
};
