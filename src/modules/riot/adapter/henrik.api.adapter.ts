import { env } from "@/env.js";
import { ExternalAPIError } from "@/shared/errors/index.js";
import {
  RiotApiPort,
  RiotAccountInfo,
  RiotRankInfo,
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
    currenttier: number;
    currenttierpatched: string;
    ranking_in_tier: number;
  };
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

      const { currenttier, currenttierpatched, ranking_in_tier } = res.data;

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
}
