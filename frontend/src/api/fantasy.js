import client from "./client";

export const getFantasyScores = async (leagueId) => {
  const res = await client.get(`/api/fantasy/${leagueId}`);
  return res.data;
};

export const getFantasyStandings = async (leagueId) => {
  const res = await client.get(`/api/fantasy/${leagueId}/standings`);
  return res.data;
};

