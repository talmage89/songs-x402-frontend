import { Link } from "react-router-dom";
import type { Song } from "../types";

const formatNumber = (num: number): string => {
  return num.toLocaleString();
};

interface SongCardProps {
  song: Song;
}

export const SongCard = ({ song }: SongCardProps) => {
  const voteCount = song.upvotes - song.downvotes;

  return (
    <Link
      to={`/songs/${song.id}`}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      <div className="aspect-square bg-gray-200 flex items-center justify-center">
        <span className="text-gray-400 text-sm">Photo Placeholder</span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {song.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="font-medium">Rating:</span>
          <span className={voteCount >= 0 ? "text-green-600" : "text-red-600"}>
            {voteCount > 0 ? "+" : ""}
            {formatNumber(voteCount)}
          </span>
        </div>
      </div>
    </Link>
  );
};
