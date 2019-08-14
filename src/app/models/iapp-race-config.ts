import { IRaceDriver } from './irace-driver';

export interface IAppRaceConfig {
  raceDrivers : IRaceDriver[];
  bestRaceLapId? : number;
  bestRaceLapRaceDriverId? : string;
  bestRaceWinnerDriverId? : string;
  numMaxRaceLaps? : number;
}