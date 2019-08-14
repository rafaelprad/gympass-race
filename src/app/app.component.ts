import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import * as numeral from 'numeral';
import { AppRaceConfigService } from './app-race-config.service';
import { IAppRaceConfig } from './models/iapp-race-config';
import { IRaceDriver } from './models/irace-driver';
import { UtilText } from './utils/util-text';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Gympass Race';

  appRaceConfig : IAppRaceConfig;

  raceLapsColumns: string[] = [];
  displayedColumns: string[] = ['endPositionRace', 'driverId', 'driverName', 'raceSpeedAverage', 'raceDurationTimeLater', 'raceDurationTime', 'qtyRaceLapCompleted'];
  dataSourceRace : MatTableDataSource<IRaceDriver>;

  constructor(
    private appConfigService: AppRaceConfigService
  ) {
    this.appConfigService.subscribe(this, this.setConfig);
  }

  ngAfterViewInit() {

  }

  setConfig(caller: any, appRaceConfigSubject: IAppRaceConfig) {
    const appComponent: AppComponent = <AppComponent>caller;
    appComponent.appRaceConfig = appRaceConfigSubject;
    appComponent.dataSourceRace = new MatTableDataSource(appComponent.appRaceConfig.raceDrivers);
    appComponent.loadColumnRaceLaps();
  }

  loadColumnRaceLaps() : void {
    this.raceLapsColumns = [];

    for( let idxRaceLap : number = 0; idxRaceLap < this.appRaceConfig.numMaxRaceLaps; idxRaceLap++ ) {
      this.raceLapsColumns.push('raceLap_'+idxRaceLap);
      this.displayedColumns.push('raceLap_'+idxRaceLap);
    }
  }

  getColumnsRaceLaps() : string[] {
     return this.raceLapsColumns;
  }

  getDataRaceLap( raceDriver : IRaceDriver, columnName : string, appRaceConfig? : IAppRaceConfig ) : string {
    let result : string = '';
    let idxRaceLap : number = Number.parseInt(columnName.replace('raceLap_', ''));

    if (idxRaceLap < raceDriver.raceLaps.length) {
      result = this.getTextDurationTime(raceDriver.raceLaps[idxRaceLap].durationTime);
      if ( raceDriver.bestRaceLapId === raceDriver.raceLaps[idxRaceLap].id ) {
        result += '(*)';
      }
      if ( appRaceConfig.bestRaceLapRaceDriverId === raceDriver.id &&
           appRaceConfig.bestRaceLapId === raceDriver.raceLaps[idxRaceLap].id ) {
        result += '(**)';
      }
    } else {
      result = '----';
    }

    return result;
  }

  getDataRaceLapDescription(columnName : string) {
    let result : string = 'Race Lap ';
    let idxRaceLap : number = Number.parseInt(columnName.replace('raceLap_', '')) + 1;
    result += idxRaceLap;
    return result;
  }

  getTextDurationTime(numDurationTime : number) : string {
    let result : string = '';

    const numMinutes : number = Math.floor(( numDurationTime / 1000 ) / 60);
    const numSeconds : number = Math.floor(( numDurationTime / 1000 ) % 60);
    const numMiliseconds : number = numDurationTime - ( ( numMinutes * 60 * 1000 ) + ( numSeconds * 1000 ) );

    result = UtilText.format("{0}:{1}.{2}", numeral(numMinutes).format('00'),
    numeral(numSeconds).format('00'), numeral(numMiliseconds).format('000'));

    return result;
  }

  getRaceSpeedAverage(raceSpeedAverage : number) : string {

    return  numeral(raceSpeedAverage).format('#.00');
  }

  getQtyRaceLapCompleted(raceDriver : IRaceDriver) : number {

    return  raceDriver.raceLaps.length;
  }
}
