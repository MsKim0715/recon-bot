import { RiotRegion } from "@/shared/types/riot.types.js";

export class RiotAccount{
    constructor(
        public readonly gameName : string,
        public readonly tag : string,
        public readonly puuid : string,
        public readonly region : RiotRegion,
    ) {}
}