import API from "./client";

export const getScores = async () => {
  const res = await API.get("/nfl/scores");
  return res.data;
};

