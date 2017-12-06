import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { chart } from 'highcharts';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('chartTarget') chartTarget: ElementRef;
  chart: Highcharts.ChartObject;
  heatTime = 0;
  currentReading = null;
  isAuthorized = true;
  maxDataLength = 288;
  dataSubscription: Subscription;
  downstairsMax: number;
  downstairsMin: number;
  upstairsMax: number;
  upstairsMin: number;
  outsideMax: number;
  outsideMin: number;
  downstairsHumidityMax: number;
  downstairsHumidityMin: number;
  upstairsHumidityMax: number;
  upstairsHumidityMin: number;  

  constructor(public db: AngularFireDatabase, public afAuth: AngularFireAuth) {
    this.subscribeToData();
  }

  subscribeToData() {
    if (this.dataSubscription) {
      this.dataSubscription.unsubscribe();
    }
    this.dataSubscription = this.db.list('readings', ref => ref.limitToLast(this.maxDataLength)).valueChanges().subscribe((readings) => this.createChart(readings), () => {this.isAuthorized = false});
  }

  ngAfterViewInit() {
    const options: Highcharts.Options = {
      chart: {
        type: 'line',
        zoomType: 'x'
      },
      title: {
        text: ''
      },          
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: {
          minute:  '%I:%M %p',
          hour: '%I %p'
        }
      },
      yAxis: [{
        title: {
          text: '°F'
        }
      }, {
        title: {
          text: ''
        },
        opposite: true
      }],
      tooltip: {
        xDateFormat: '%Y-%m-%d %I:%M %p'
      },
      credits: {
        enabled: false
      },
      plotOptions: {
        line: {
          marker: {
            enabled: false
          }
        }
      }
    }; 
    var series: any = [{
        name: 'Downstairs',
        data: []
      },
      {
        name: 'Upstairs',
        data: []
      },
      {
        name: 'Set Temp',
        data: [],
        dashStyle: 'Dash'
      },
      {
        name: 'Outside',
        data: []
      },
      {
        name: 'Humidity Downstairs',
        data: [],
        visible: false,
        yAxis: 1
      },
      {
        name: 'Humidity Upstairs',
        data: [],
        visible: false,
        yAxis: 1
      }
    ];
    options.series = series;  
    this.chart = chart(this.chartTarget.nativeElement, options);
  }

  ngOnDestroy() {
    this.chart = null;
  }

  createChart(readings: any[]) {
    this.heatTime = 0, this.downstairsMax = null, this.downstairsMin = null, this.upstairsMax = null, this.upstairsMin = null, this.outsideMax = null, this.outsideMin = null, this.downstairsHumidityMax = null, this.downstairsHumidityMin = null, this.upstairsHumidityMax = null, this.upstairsHumidityMin = null;  
    var dataTemp = [];
    var dataTempUpstairs = [];
    var dataSetTemp = [];
    var dataOutsideTemp = [];
    var heatBands = [];
    var dataHumidity = [];
    var dataHumidityUpstairs = [];
    var heatStart = null;
    this.currentReading = readings[readings.length - 1];
    readings.forEach(reading => {      
      dataTemp.push([reading.timestamp,reading.one.temperature]);
      dataHumidity.push([reading.timestamp,reading.one.humidity]);
      if (reading.two) {
        dataTempUpstairs.push([reading.timestamp,reading.two.temperature]);
        dataHumidityUpstairs.push([reading.timestamp,reading.two.humidity]);
        if (!this.upstairsMax || this.upstairsMax < reading.two.temperature) {
          this.upstairsMax = reading.two.temperature;
        } 
        if (!this.upstairsMin || this.upstairsMin > reading.two.temperature) {
          this.upstairsMin = reading.two.temperature;
        } 
        if (!this.upstairsHumidityMax || this.upstairsHumidityMax < reading.two.humidity) {
          this.upstairsHumidityMax = reading.two.humidity;
        } 
        if (!this.upstairsHumidityMin || this.upstairsHumidityMin > reading.two.humidity) {
          this.upstairsHumidityMin = reading.two.humidity;
        }
      } else {
        dataTempUpstairs.push([reading.timestamp,null]);
        dataHumidityUpstairs.push([reading.timestamp,null]);
      }
      dataSetTemp.push([reading.timestamp,reading.targetTemperature]);
      dataOutsideTemp.push([reading.timestamp,reading.temperatureOutside]);
      if (reading.one.isHvacOn) {
        this.heatTime += 5;
      }
      if (heatStart && !reading.one.isHvacOn) {
        heatBands.push([heatStart, reading.timestamp]);
        heatStart = null;
      }
      if (!heatStart && reading.one.isHvacOn) {
        heatStart = reading.timestamp;
      }
      if (!this.downstairsMax || this.downstairsMax < reading.one.temperature) {
        this.downstairsMax = reading.one.temperature;
      } 
      if (!this.downstairsMin || this.downstairsMin > reading.one.temperature) {
        this.downstairsMin = reading.one.temperature;
      } 
      if (!this.outsideMax || this.outsideMax < reading.temperatureOutside) {
        this.outsideMax = reading.temperatureOutside;
      } 
      if (!this.outsideMin || this.outsideMin > reading.temperatureOutside) {
        this.outsideMin = reading.temperatureOutside;
      }     
      if (!this.downstairsHumidityMax || this.downstairsHumidityMax < reading.one.humidity) {
        this.downstairsHumidityMax = reading.one.humidity;
      } 
      if (!this.downstairsHumidityMin || this.downstairsHumidityMin > reading.one.humidity) {
        this.downstairsHumidityMin = reading.one.humidity;
      } 
    });
    if (heatStart) {
      heatBands.push([heatStart, this.currentReading.timestamp]);
    }
    this.chart.series[0].setData(dataTemp);
    this.chart.series[1].setData(dataTempUpstairs);
    this.chart.series[2].setData(dataSetTemp);
    this.chart.series[3].setData(dataOutsideTemp);
    this.chart.series[4].setData(dataHumidity);
    this.chart.series[5].setData(dataHumidityUpstairs);
    this.chart.xAxis[0].removePlotBand('band');
    heatBands.forEach(band => {
      this.addHeatPlotBand(band);
    });
  }

  addHeatPlotBand(band) {
    this.chart.xAxis[0].addPlotBand({
      id: 'band',
      color: 'rgba(255, 0, 00, 0.2)', 
      from: band[0], 
      to: band[1]
    });
  }

  logout() {
    var googleAuthProvider = new firebase.auth.GoogleAuthProvider();
    googleAuthProvider.setCustomParameters({
       prompt: 'select_account'
    });
    firebase.auth().signInWithRedirect(googleAuthProvider);
  }

  changeDataLength(newLength: number) {
    if (newLength === this.maxDataLength) {
      return;
    }
    this.maxDataLength = newLength;
    this.subscribeToData();
  }

}
