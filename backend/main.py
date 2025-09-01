from fastapi import FastAPI
import httpx
from config import ODDS_API_KEY, SPORTSDATA_API_KEY

# ✅ App must be defined before any routes
app = FastAPI(title="NFL Fantasy Betting API")

SPORTSDATA_BASE = "https://api.sportsdata.io/v3/nfl/scores/json"
ODDSAPI_BASE = "https://api.the-odds-api.com/v4/sports"


# --- Root ---
@app.get("/")
def root():
    return {"message": "NFL Fantasy Betting API is running"}


# --- Fantasy Scores (head-to-head with W-L records) ---
@app.get("/api/fantasy/{league_id}")
async def get_fantasy_scores(league_id: str):
    try:
        async with httpx.AsyncClient() as client:
            # Current week
            state_resp = await client.get("https://api.sleeper.app/v1/state/nfl")
            if state_resp.status_code != 200:
                return {"error": "Sleeper state unavailable"}
            current_week = state_resp.json().get("week", 1)

            # Matchups
            matchup_url = f"https://api.sleeper.app/v1/league/{league_id}/matchups/{current_week}"
            matchup_resp = await client.get(matchup_url)
            if matchup_resp.status_code != 200:
                return {"error": "No fantasy matchups available"}
            matchups = matchup_resp.json()

            # Rosters
            roster_url = f"https://api.sleeper.app/v1/league/{league_id}/rosters"
            roster_resp = await client.get(roster_url)
            roster_resp.raise_for_status()
            rosters = roster_resp.json()

            # Users
            users_url = f"https://api.sleeper.app/v1/league/{league_id}/users"
            users_resp = await client.get(users_url)
            users_resp.raise_for_status()
            users = users_resp.json()
    except Exception as e:
        return {"error": f"Fantasy API error: {str(e)}"}

    # Map roster_id → team + owner + record
    roster_map = {}
    for r in rosters:
        owner_id = r.get("owner_id")
        owner_name = next((u.get("display_name", "Unknown") for u in users if u.get("user_id") == owner_id), "Unknown")
        metadata = r.get("metadata") or {}
        team_name = metadata.get("team_name") or f"Roster {r['roster_id']}"
        wins = r.get("settings", {}).get("wins", 0)
        losses = r.get("settings", {}).get("losses", 0)
        ties = r.get("settings", {}).get("ties", 0)
        record = f"{wins}-{losses}" if ties == 0 else f"{wins}-{losses}-{ties}"
        roster_map[r["roster_id"]] = {
            "team_name": team_name,
            "owner_name": owner_name,
            "record": record
        }

    # Group into head-to-head
    matchup_pairs, head_to_head = {}, []
    for m in matchups:
        mid = m.get("matchup_id")
        if mid not in matchup_pairs:
            matchup_pairs[mid] = []
        info = roster_map.get(m.get("roster_id"), {"team_name": "Unknown", "owner_name": "Unknown", "record": "0-0"})
        matchup_pairs[mid].append({
            "team_name": info["team_name"],
            "owner_name": info["owner_name"],
            "record": info["record"],
            "points": m.get("points", 0)
        })

    for mid, teams in matchup_pairs.items():
        if len(teams) == 2:
            head_to_head.append({"matchup_id": mid, "team1": teams[0], "team2": teams[1]})

    if not head_to_head:
        return {"error": "No head-to-head matchups yet"}

    return {"week": current_week, "matchups": head_to_head}


# --- Fantasy Standings (League Leaderboard) ---
@app.get("/api/fantasy/{league_id}/standings")
async def get_fantasy_standings(league_id: str):
    try:
        async with httpx.AsyncClient() as client:
            roster_url = f"https://api.sleeper.app/v1/league/{league_id}/rosters"
            roster_resp = await client.get(roster_url)
            roster_resp.raise_for_status()
            rosters = roster_resp.json()

            users_url = f"https://api.sleeper.app/v1/league/{league_id}/users"
            users_resp = await client.get(users_url)
            users_resp.raise_for_status()
            users = users_resp.json()
    except Exception as e:
        return {"error": f"Fantasy API error: {str(e)}"}

    user_map = {u.get("user_id"): u.get("display_name", "Unknown") for u in users}

    standings = []
    for r in rosters:
        owner_name = user_map.get(r.get("owner_id"), "Unknown")
        metadata = r.get("metadata") or {}
        team_name = metadata.get("team_name") or f"Roster {r['roster_id']}"

        settings = r.get("settings", {})
        wins, losses, ties = settings.get("wins", 0), settings.get("losses", 0), settings.get("ties", 0)
        pf = round(settings.get("fpts", 0) + settings.get("fpts_decimal", 0) / 100, 2)
        pa = round(settings.get("fpts_against", 0) + settings.get("fpts_against_decimal", 0) / 100, 2)

        record = f"{wins}-{losses}" if ties == 0 else f"{wins}-{losses}-{ties}"

        standings.append({
            "team_name": team_name,
            "owner_name": owner_name,
            "record": record,
            "wins": wins,
            "losses": losses,
            "ties": ties,
            "pf": pf,
            "pa": pa
        })

    standings.sort(key=lambda x: (x["wins"], x["pf"]), reverse=True)

    return {"standings": standings}


# --- Live Games (with fallback) ---
@app.get("/api/games/live")
async def get_live_games():
    headers = {"Ocp-Apim-Subscription-Key": SPORTSDATA_API_KEY}

    try:
        async with httpx.AsyncClient() as client:
            season_resp = await client.get(f"{SPORTSDATA_BASE}/CurrentSeason", headers=headers)
            if season_resp.status_code != 200:
                return {"error": "Season info unavailable"}
            season = season_resp.json()

            week_resp = await client.get(f"{SPORTSDATA_BASE}/CurrentWeek", headers=headers)
            if week_resp.status_code != 200:
                return {"error": "Week info unavailable"}
            week = week_resp.json()

            scores_resp = await client.get(f"{SPORTSDATA_BASE}/ScoresByWeek/{season}/{week}", headers=headers)
            if scores_resp.status_code != 200:
                return {"error": "No live games available"}
            scores = scores_resp.json()
    except Exception as e:
        return {"error": f"SportsData API error: {str(e)}"}

    return {"season": season, "week": week, "games": scores}


# --- Odds API (with fallback) ---
@app.get("/api/odds/upcoming")
async def get_odds():
    try:
        url = f"{ODDSAPI_BASE}/americanfootball_nfl/odds"
        params = {"apiKey": ODDS_API_KEY, "regions": "us", "markets": "h2h,spreads,totals"}
        async with httpx.AsyncClient() as client:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                return {"error": "No odds available"}
            return r.json()
    except Exception as e:
        return {"error": f"Odds API error: {str(e)}"}


# --- Recommended Parlay (with fallback) ---
@app.get("/api/parlay/recommended")
async def get_recommended_parlay(legs: int = 5):
    try:
        url = f"{ODDSAPI_BASE}/americanfootball_nfl/odds"
        params = {"apiKey": ODDS_API_KEY, "regions": "us", "markets": "h2h"}
        async with httpx.AsyncClient() as client:
            r = await client.get(url, params=params)
            if r.status_code != 200:
                return {"error": "No recommended parlay available"}
            data = r.json()
    except Exception as e:
        return {"error": f"Odds API error: {str(e)}"}

    picks = []
    for g in data[:legs]:
        if g.get("bookmakers"):
            outcome = g["bookmakers"][0]["markets"][0]["outcomes"][0]
            picks.append({"name": outcome["name"], "price": outcome["price"]})

    if not picks:
        return {"error": "Not enough odds data to build parlay"}

    return {"recommended_parlay": {"legs": picks, "target_odds": "+600"}}


# --- Calculate Parlay ---
@app.post("/api/parlay/calculate")
async def calculate_parlay(data: dict):
    odds = data.get("odds", [])
    wager = data.get("wager", 100)

    if not odds:
        return {"error": "No odds provided"}

    decimal_odds, combined = [], 1
    for o in odds:
        if o > 0:
            decimal_odds.append(o / 100 + 1)
        else:
            decimal_odds.append(100 / abs(o) + 1)
    for d in decimal_odds:
        combined *= d

    payout = wager * combined
    return {
        "legs": odds,
        "odds": round(combined, 2),
        "probability": round(1 / combined, 4),
        "wager": wager,
        "payout": round(payout, 2),
    }

