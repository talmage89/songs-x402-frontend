import { useCallback, useEffect, useRef } from "react";
import type { SongWithComments, WebSocketMessage } from "../types";

const API_HOST = import.meta.env.VITE_API_HOST || "";

const getWebSocketUrl = (songId: number): string => {
  const baseUrl = API_HOST.replace(/^https?/, (match: string) =>
    match === "https" ? "wss" : "ws",
  );
  return `${baseUrl}/d/${songId}/ws`;
};

export const useSongWebSocket = (
  songId: number | undefined,
  onUpdate: (song: SongWithComments) => void,
  onError?: (error: string) => void,
) => {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isIntentionalCloseRef = useRef(false);
  const hasConnectedRef = useRef(false);
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
    onErrorRef.current = onError;
  }, [onUpdate, onError]);

  const MAX_RECONNECT_ATTEMPTS = 3;
  const RECONNECT_DELAY = 3000;

  const connect = useCallback(() => {
    if (!songId) return;

    if (wsRef.current) {
      isIntentionalCloseRef.current = true;
      wsRef.current.close();
    }

    try {
      const ws = new WebSocket(getWebSocketUrl(songId));
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptsRef.current = 0;
        hasConnectedRef.current = true;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WebSocketMessage;
          message.type === "update"
            ? onUpdateRef.current(message.data)
            : onErrorRef.current?.(message.message);
        } catch (err) {
          onErrorRef.current?.(
            err instanceof Error ? err.message : "Failed to parse message",
          );
        }
      };

      ws.onerror = () => {
        onErrorRef.current?.("WebSocket connection error");
      };

      ws.onclose = () => {
        wsRef.current = null;

        // Only retry if we haven't successfully connected and it wasn't an intentional close
        if (
          !isIntentionalCloseRef.current &&
          !hasConnectedRef.current &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = window.setTimeout(
            connect,
            RECONNECT_DELAY,
          );
        } else {
          // Reset on intentional close or after successful connection
          reconnectAttemptsRef.current = 0;
          if (isIntentionalCloseRef.current) {
            hasConnectedRef.current = false;
          }
        }
      };
    } catch (err) {
      onErrorRef.current?.(
        err instanceof Error ? err.message : "Failed to connect",
      );
    }
  }, [songId]);

  useEffect(() => {
    if (!songId) return;

    reconnectAttemptsRef.current = 0;
    isIntentionalCloseRef.current = false;
    hasConnectedRef.current = false;
    connect();

    return () => {
      isIntentionalCloseRef.current = true;
      if (reconnectTimeoutRef.current !== null) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      reconnectAttemptsRef.current = 0;
    };
  }, [songId, connect]);
};
