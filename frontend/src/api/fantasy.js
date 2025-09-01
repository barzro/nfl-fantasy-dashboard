import API from "./client";

export const getFantasyScores = async (leagueId) => {
  const res = await API.get(`/fantasy/${leagueId}`);
  return res.data;
};

