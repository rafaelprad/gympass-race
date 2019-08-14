import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { IAppRaceConfig } from './models/iapp-race-config';
import { Validator } from './utils/validator';
import { IRaceDriver } from './models/irace-driver';
import { IRaceLap } from './models/irace-lap';
import * as moment from 'moment';

const RACE_LAP_START_TIME_COLUMN : number = 0;
const RACE_DRIVER_ID_COLUMN : number = 1;
const RACE_DRIVER_NAME_COLUMN : number = 3;
const RACE_LAP_ID_COLUMN : number = 4;
const RACE_LAP_DURATION_COLUMN : number = 5;
const RACE_LAP_SPEED_COLUMN : number = 6;

@Injectable()
export class AppRaceConfigService {
  public appRaceConfig: IAppRaceConfig;
  public appRaceConfigNull: IAppRaceConfig = null;
  private appRaceConfigSubject: BehaviorSubject<IAppRaceConfig> = new BehaviorSubject<IAppRaceConfig>(null);

  constructor(private http: HttpClient) {
    this.load().then(
      appRaceConfig => {
        this.setAppRaceConfig(appRaceConfig);
        return this.appRaceConfig;
      },
      error => {
        console.log(error);
        return null;
      }
    );
  }

  public load() {
    // Only want to do this once - if root page is revisited, it calls this again.
    if (Validator.isNullUndefined(this.appRaceConfig)) {
      console.log('Loading app-race-config');

      return this.http
        .get('../assets/app-race-config.txt', {responseType: 'text'})
        .pipe(map<string, IAppRaceConfig>(data => {
          let result = this.parseRaceConfigData(data);
          return result;
        }))
        .toPromise<IAppRaceConfig>();
    }

    return Promise.resolve(this.appRaceConfigNull);
  }

  private parseRaceConfigData( data : string, staIgnoreFirstLine : boolean = true ) : IAppRaceConfig{
    let result : IAppRaceConfig = <IAppRaceConfig>{};
    if (!Validator.isNullUndefinedEmpty(data) ) {
      
      const splitLineData : string[] = data.split(new RegExp("\\n"));
      
      let idxStartSplitLineData = 0;
      if ( staIgnoreFirstLine ) {
        idxStartSplitLineData++;
      }

      for( let idxSplitLineData : number = idxStartSplitLineData; idxSplitLineData < splitLineData.length; idxSplitLineData++ ) {
        const lineData : string = splitLineData[idxSplitLineData];
        
        let splitColumnLineData : string[] = lineData.split(new RegExp("\\s"));
        splitColumnLineData = splitColumnLineData.filter( ( columnLineData : string ) => { return columnLineData.trim().length > 0 } );

        let raceLapStartTime = splitColumnLineData[RACE_LAP_START_TIME_COLUMN];
        let raceDriverId = splitColumnLineData[RACE_DRIVER_ID_COLUMN];
        let raceDriverName = splitColumnLineData[RACE_DRIVER_NAME_COLUMN];
        let raceLapId = splitColumnLineData[RACE_LAP_ID_COLUMN];
        let raceLapDuration = splitColumnLineData[RACE_LAP_DURATION_COLUMN];
        let raceLapSpeed = splitColumnLineData[RACE_LAP_SPEED_COLUMN].replace(',', '.');
        
        if ( Validator.isNullUndefined(result.raceDrivers) ) {
          result.raceDrivers = [];
        }

        let raceDriver : IRaceDriver = result.raceDrivers.find( ( raceDriver : IRaceDriver ) => { return raceDriver.id === raceDriverId; });
        if ( Validator.isNullUndefined(raceDriver) ) {

          raceDriver = <IRaceDriver>{ id : raceDriverId, name : raceDriverName };
          raceDriver.raceLaps = [];

          result.raceDrivers.push(raceDriver);
        }

        let startTime = moment.utc(raceLapStartTime, "HH:mm:ss.SSS");
        let splitRaceLapDuration = raceLapDuration.split(new RegExp("([0-9]:)|([0-5][0-9].)|([0-9][0-9][0-9])"));
        splitRaceLapDuration = splitRaceLapDuration.filter( ( value : string ) => { 
          return !Validator.isNullUndefinedEmpty(value);
        });
        splitRaceLapDuration[0] = splitRaceLapDuration[0].replace(':', '');
        splitRaceLapDuration[1] = splitRaceLapDuration[1].replace('.', '');

        const numRaceLapMinutes : number = Number.parseInt(splitRaceLapDuration[0]);
        const numRaceLapSeconds : number = Number.parseInt(splitRaceLapDuration[1]);
        const numRaceLapMilliseconds : number = Number.parseInt(splitRaceLapDuration[2]);

        let endTime = startTime.clone()
          .add(numRaceLapMinutes, 'minutes')
          .add(numRaceLapSeconds, 'seconds')
          .add(numRaceLapMilliseconds, 'milliseconds');

        const raceLap : IRaceLap = { id : Number.parseInt(raceLapId),
          startTime : startTime.toISOString(),
          endTime : endTime.toISOString(),
          durationTime : ( numRaceLapMinutes*60*1000 ) + ( numRaceLapSeconds*1000 ) + ( numRaceLapMilliseconds ) ,
          averageSpeed : Number.parseFloat(raceLapSpeed)
         };

        raceDriver.raceLaps.push(raceLap);

      }

      if ( result.raceDrivers.length > 0 ) {

        result.numMaxRaceLaps = 0;
        
        let bestRaceLapDuration : number = result.raceDrivers[0].raceLaps[0].durationTime;
        result.bestRaceLapId = result.raceDrivers[0].raceLaps[0].id;
        result.bestRaceLapRaceDriverId = result.raceDrivers[0].id;
  
        for( let idxRaceDriver : number = 0; idxRaceDriver < result.raceDrivers.length; idxRaceDriver++ ) {
          
          result.raceDrivers[idxRaceDriver].bestRaceLapId = result.raceDrivers[idxRaceDriver].raceLaps[0].id;
          let bestRaceLapRaceDriverDuration : number = result.raceDrivers[idxRaceDriver].raceLaps[0].durationTime;

          result.raceDrivers[idxRaceDriver].speedAverage = 0;
          result.raceDrivers[idxRaceDriver].raceDurationTime = 0;
          
          for( let idxRaceDriverRaceLap : number = 0; idxRaceDriverRaceLap < result.raceDrivers[idxRaceDriver].raceLaps.length; idxRaceDriverRaceLap++ ) {
  
            // check for best race lap for the race driver
            if ( result.raceDrivers[idxRaceDriver].raceLaps[idxRaceDriverRaceLap].durationTime < bestRaceLapRaceDriverDuration ) {
  
              result.raceDrivers[idxRaceDriver].bestRaceLapId = result.raceDrivers[idxRaceDriver].raceLaps[idxRaceDriverRaceLap].id;
              bestRaceLapRaceDriverDuration = result.raceDrivers[idxRaceDriver].raceLaps[idxRaceDriverRaceLap].durationTime;
            }
  
            // check for best race lap for the race
            if ( result.raceDrivers[idxRaceDriver].raceLaps[idxRaceDriverRaceLap].durationTime < bestRaceLapDuration ) {
  
              result.bestRaceLapId = result.raceDrivers[idxRaceDriver].raceLaps[idxRaceDriverRaceLap].id;
              result.bestRaceLapRaceDriverId = result.raceDrivers[idxRaceDriver].id;
  
              bestRaceLapDuration = result.raceDrivers[idxRaceDriver].raceLaps[idxRaceDriverRaceLap].durationTime;
            }

            // sum total speed average
            result.raceDrivers[idxRaceDriver].speedAverage += result.raceDrivers[idxRaceDriver].raceLaps[idxRaceDriverRaceLap].averageSpeed;

            // sum total duration
            result.raceDrivers[idxRaceDriver].raceDurationTime += result.raceDrivers[idxRaceDriver].raceLaps[idxRaceDriverRaceLap].durationTime;
          }
  
          // check max race laps
          if ( result.raceDrivers[idxRaceDriver].raceLaps.length > result.numMaxRaceLaps ) {
            result.numMaxRaceLaps = result.raceDrivers[idxRaceDriver].raceLaps.length;
          }

          // divide speed average for the quantity race laps
          result.raceDrivers[idxRaceDriver].speedAverage = result.raceDrivers[idxRaceDriver].speedAverage / result.raceDrivers[idxRaceDriver].raceLaps.length;
        }

        // check for the winner and winner time race
        let bestRaceDurationTimeWinner : number = -1;

        for( let idxRaceDriver : number = 0; idxRaceDriver < result.raceDrivers.length; idxRaceDriver++ ) {
          
          if ( result.raceDrivers[idxRaceDriver].raceLaps.length === result.numMaxRaceLaps ) {
            if ( bestRaceDurationTimeWinner === -1 || result.raceDrivers[idxRaceDriver].raceDurationTime < bestRaceDurationTimeWinner ) {
              
              bestRaceDurationTimeWinner = result.raceDrivers[idxRaceDriver].raceDurationTime;              
              result.bestRaceWinnerDriverId = result.raceDrivers[idxRaceDriver].id;
            }
          }
        }

        // sort position that each driver finish's race

        result.raceDrivers.sort(function(raceDriverA, raceDriverB){return raceDriverA.raceDurationTime - raceDriverB.raceDurationTime; });

        // check for the drivers duration time later
        for( let idxRaceDriver : number = 0; idxRaceDriver < result.raceDrivers.length; idxRaceDriver++ ) {
          
          if ( result.raceDrivers[idxRaceDriver].id !== result.bestRaceWinnerDriverId ) {
            result.raceDrivers[idxRaceDriver].raceDurationTimeLater = result.raceDrivers[idxRaceDriver].raceDurationTime - bestRaceDurationTimeWinner;
          } else {
            result.raceDrivers[idxRaceDriver].raceDurationTimeLater = 0;
          }

          // register position id for the race driver after sorted
          result.raceDrivers[idxRaceDriver].endPositionRace = idxRaceDriver + 1;
        }



      }
    }
    return result;
  }

  public setAppRaceConfig(appRaceConfig: IAppRaceConfig) {
    if (Validator.isNullUndefined(appRaceConfig)) {
      return;
    }

    this.appRaceConfig = appRaceConfig;
    console.log(this.appRaceConfig);

    if (this.appRaceConfigSubject) {
      this.appRaceConfigSubject.next(this.appRaceConfig);
    }
  }

  public subscribe(caller: any, callback: (caller: any, appRaceConfigSubjectData: IAppRaceConfig) => void) {
    this.appRaceConfigSubject.subscribe(appRaceConfigSubjectData => {
      if (appRaceConfigSubjectData === null) {
        return;
      }
      callback(caller, appRaceConfigSubjectData);
    });
  }
}