import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { songsApi } from "../api/songs";
import { useSongWebSocket } from "../hooks/useSongWebSocket";
import type { SongWithComments } from "../types";
import { commentBodySchema } from "../types";

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

export const SongDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [song, setSong] = useState<SongWithComments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const shouldFocusAfterSubmit = useRef(false);

  const songId = id ? Number.parseInt(id, 10) : undefined;

  useEffect(() => {
    const fetchSong = async () => {
      if (!songId) {
        navigate("/");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const foundSong = await songsApi.getById(songId);
        setSong(foundSong);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load song");
      } finally {
        setLoading(false);
      }
    };

    fetchSong();
  }, [songId, navigate]);

  useSongWebSocket(
    songId,
    (updatedSong) => setSong(updatedSong),
    (errorMessage) => song && console.error("WebSocket error:", errorMessage),
  );

  useEffect(() => {
    if (
      !submittingComment &&
      shouldFocusAfterSubmit.current &&
      commentText === ""
    ) {
      shouldFocusAfterSubmit.current = false;
      requestAnimationFrame(() => {
        commentInputRef.current?.focus();
      });
    }
  }, [submittingComment, commentText]);

  const handleUpvote = async () => {
    if (!song || voting) return;

    setVoting(true);
    try {
      await songsApi.upvote(song.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upvote");
    } finally {
      setVoting(false);
    }
  };

  const handleDownvote = async () => {
    if (!song || voting) return;

    setVoting(true);
    try {
      await songsApi.downvote(song.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to downvote");
    } finally {
      setVoting(false);
    }
  };

  const isValidComment = useMemo(() => {
    const result = commentBodySchema.safeParse({ text: commentText });
    return result.success;
  }, [commentText]);

  const maxLength = useMemo(() => {
    const textSchema = commentBodySchema.shape.text;
    if ("maxLength" in textSchema && typeof textSchema.maxLength === "number") {
      return textSchema.maxLength;
    }
    return null;
  }, []);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!song || !isValidComment || submittingComment) return;

    setSubmittingComment(true);
    setError(null);
    try {
      await songsApi.comment(song.id, commentText.trim());
      setCommentText("");
      shouldFocusAfterSubmit.current = true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Loading song...</p>
      </div>
    );
  }

  if (error && !song) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!song) {
    return null;
  }

  const voteCount = song.upvotes - song.downvotes;

  return (
    <div className="max-w-7xl mx-auto">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="text-gray-600 hover:text-gray-900 mb-6 text-sm"
      >
        ← Back to list
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="aspect-video bg-gray-200 flex items-center justify-center">
          <span className="text-gray-400">Photo Placeholder</span>
        </div>

        <div className="p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            {song.title}
          </h1>

          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUpvote}
                disabled={voting}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Upvote"
              >
                <ArrowUp className="w-6 h-6 text-gray-700" />
              </button>
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(song.upvotes)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownvote}
                disabled={voting}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Downvote"
              >
                <ArrowDown className="w-6 h-6 text-gray-700" />
              </button>
              <span className="text-lg font-semibold text-gray-900">
                {formatNumber(song.downvotes)}
              </span>
            </div>

            <div className="text-lg text-gray-600">
              <span className="font-medium">Net rating:</span>{" "}
              <span
                className={voteCount >= 0 ? "text-green-600" : "text-red-600"}
              >
                {voteCount > 0 ? "+" : ""}
                {formatNumber(voteCount)}
              </span>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <div className="px-6 pb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Comments
            </h2>

            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="relative">
                <textarea
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  maxLength={maxLength ?? undefined}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none mb-2"
                  disabled={submittingComment}
                />
                {maxLength !== null && (
                  <div className="absolute top-3 right-3 text-xs text-gray-400 pointer-events-none">
                    {maxLength - commentText.length} left
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!isValidComment || submittingComment}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submittingComment ? "Posting..." : "Post"}
                </button>
              </div>
            </form>

            <div className="max-h-96 overflow-y-auto space-y-3">
              {song.comments.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">No comments yet.</p>
              ) : (
                [...song.comments]
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime(),
                  )
                  .map((comment) => (
                    <div
                      key={comment.id}
                      className="border-b border-gray-200 pb-3"
                    >
                      <p className="text-gray-900 text-sm">{comment.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(comment.created_at).toLocaleString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          },
                        )}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
