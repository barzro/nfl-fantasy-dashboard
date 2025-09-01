import client from "./client";

export const getOdds = async () => {
  const res = await client.get("/api/odds/upcoming");
  return res.data;
};

export const getRecommendedParlay = async (legs = 5) => {
  const res = await client.get(`/api/parlay/recommended?legs=${legs}`);
  return res.data;
};

export const calculateParlay = async (odds, wager) => {
  const res = await client.post("/api/parlay/calculate", { odds, wager });
  return res.data;
};

