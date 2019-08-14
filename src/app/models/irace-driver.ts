import { IRaceLap } from './irace-lap';

export interface IRaceDriver {
  id : string;
  name : string;
  raceLaps : IRaceLap[];
  bestRaceLapId? : number;
  speedAverage? : number;
  raceDurationTime? : number;
  raceDurationTimeLater? : number;
  endPositionRace? : number;
}