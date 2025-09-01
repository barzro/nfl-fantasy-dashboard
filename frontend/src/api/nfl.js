import client from "./client";

export const getLiveGames = async () => {
  const res = await client.get("/api/games/live");
  return res.data;
};

