import API from "./client";

export const getUpcomingOdds = async () => {
  const res = await API.get("/odds/upcoming");
  return res.data;
};

export const generateParlay = async (legs = 3) => {
  const res = await API.post(`/parlay/generate?legs=${legs}`);
  return res.data;
};

