import { createBrowserRouter } from "react-router-dom";
import { Layout } from "./components/Layout";
import { SongDetail } from "./components/SongDetail";
import { SongList } from "./components/SongList";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <SongList />,
      },
      {
        path: "songs/:id",
        element: <SongDetail />,
      },
    ],
  },
]);
