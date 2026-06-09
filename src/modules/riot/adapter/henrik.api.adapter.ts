import { env } from "@/env.js";
import { ExternalAPIError } from "@/shared/errors/index.js";
import {
  RiotApiPort,
  RiotAccountInfo,
  RiotRankInfo,
  RiotStatsInfo,
} from "../ports/riot.api.port.js";
import axios, { isAxiosError } from "axios";

interface HenrikAccountResponse {
  status: number;
  data: {
    puuid: string;
    name: string;
    tag: string;
    region: string;
  };
}

interface HenrikRankResponse {
  status: number;
  data: {
    current_data: {
      currenttier: number;
      currenttierpatched: string;
      ranking_in_tier: number;
    };
  };
}

interface HenrikStoredMatchesResponse {
  status: number;
  data: Array<{
    meta: { mode: string };
    stats: {
      team: string; // "Red" | "Blue"
      kills: number;
      deaths: number;
      assists: number;
    };
    teams: { red: number; blue: number }; // 팀별 획득 라운드 수
  }>;
}

const henrikClient = axios.create({
  baseURL: "https://api.henrikdev.xyz/valorant",
  timeout: 10000,
  headers: {
    Authorization: env.HENRIK_API_KEY ?? "",
  },
});

export class henrikApiApdater implements RiotApiPort {
  async fetchAccount(
    gameName: string,
    tagLine: string,
  ): Promise<RiotAccountInfo> {
    try {
      const { data: res } = await henrikClient.get<HenrikAccountResponse>(
        `/v2/account/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      );

      if (res.status !== 200)
        throw new ExternalAPIError("Riot 계정을 찾을 수 없습니다.");

      return {
        puuid: res.data.puuid,
        gameName: res.data.name,
        tagLine: res.data.tag,
        region: res.data.region.toUpperCase(),
      };
    } catch (e) {
      if (isAxiosError(e)) {
        if (e.response?.status === 404)
          throw new ExternalAPIError("존재하지 않는 Riot 계정입니다");
        if (e.response?.status === 429)
          throw new ExternalAPIError("API 요청 한도 초과입니다.");
        throw new ExternalAPIError("Riot API 호출에 실패했습니다");
      }
      throw e;
    }
  }

  async fetchRank(puuid: string, region: string): Promise<RiotRankInfo | null> {
    try {
      const { data: res } = await henrikClient.get<HenrikRankResponse>(
        `/v2/by-puuid/mmr/${region.toLowerCase()}/${puuid}`,
      );

      if (res.status !== 200) return null;

      const { currenttier, currenttierpatched, ranking_in_tier } =
        res.data.current_data;

      return {
        currentTier: currenttier,
        tierName: currenttierpatched,
        rr: ranking_in_tier,
      };
    } catch (e) {
      if (isAxiosError(e)) {
        if (e.response?.status === 404) return null;
        throw new ExternalAPIError("랭크 정보 조회에 실패했습니다");
      }
      throw e;
    }
  }

  // 최근 경쟁전 전적을 집계해 KDA / 승률 계산
  async fetchRecentStats(
    puuid: string,
    region: string,
  ): Promise<RiotStatsInfo | null> {
    try {
      const { data: res } = await henrikClient.get<HenrikStoredMatchesResponse>(
        `/v1/by-puuid/stored-matches/${region.toLowerCase()}/${puuid}`,
        { params: { mode: "competitive", size: 20 } },
      );

      if (res.status !== 200 || !Array.isArray(res.data)) return null;

      let kills = 0;
      let deaths = 0;
      let assists = 0;
      let wins = 0;
      let games = 0;

      for (const m of res.data) {
        if (m?.meta?.mode?.toLowerCase() !== "competitive") continue;
        const s = m.stats;
        if (!s) continue;

        kills += s.kills;
        deaths += s.deaths;
        assists += s.assists;

        const team = s.team?.toLowerCase();
        const myRounds = team === "red" ? m.teams.red : m.teams.blue;
        const oppRounds = team === "red" ? m.teams.blue : m.teams.red;
        if (myRounds > oppRounds) wins += 1;

        games += 1;
      }

      if (games === 0) return null;

      const kdaRaw = deaths === 0 ? kills + assists : (kills + assists) / deaths;
      return {
        kda: Math.round(kdaRaw * 100) / 100, // 소수 2자리
        winRate: Math.round((wins / games) * 1000) / 10, // 백분율 소수 1자리
        matchCount: games,
      };
    } catch {
      // 전적 조회 실패는 계정 연동/조회를 막지 않음 (KDA/승률만 null)
      return null;
    }
  }
}
