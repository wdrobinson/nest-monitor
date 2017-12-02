import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { chart } from 'highcharts';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-component',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements AfterViewInit {
  @ViewChild('chartTarget') chartTarget: ElementRef;
  chart: Highcharts.ChartObject;
  chartCreated = false;
  heatStart = null;
  heatTime = 0;
  currentReading = null;
  isAuthorized = true;

  constructor(public db: AngularFireDatabase, public afAuth: AngularFireAuth) {
    db.list('readings', ref => ref.limitToLast(2016)).valueChanges().subscribe((readings) => this.updateChart(readings), () => {this.isAuthorized = false});
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
      yAxis: {
        title: {
          text: '°F'
        }
      },
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
      }
    ];
    options.series = series;  
    this.chart = chart(this.chartTarget.nativeElement, options);
  }

  ngOnDestroy() {
    this.chart = null;
  }

  createChart(readings: any[]) {
    var dataTemp = [];
    var dataTempUpstairs = [];
    var dataSetTemp = [];
    var dataOutsideTemp = [];
    var heatBands = [];
    readings.forEach(reading => {
      dataTemp.push([reading.timestamp,reading.one.temperature]);
      if (reading.two) {
        dataTempUpstairs.push([reading.timestamp,reading.two.temperature]);
      } else {
        dataTempUpstairs.push([reading.timestamp,null]);
      }
      dataSetTemp.push([reading.timestamp,reading.targetTemperature]);
      dataOutsideTemp.push([reading.timestamp,reading.temperatureOutside]);
      if (reading.one.isHvacOn) {
        this.heatTime += 5;
      }
      if (this.heatStart && !reading.one.isHvacOn) {
        heatBands.push([this.heatStart, reading.timestamp]);
        this.heatStart = null;
      }
      if (!this.heatStart && reading.one.isHvacOn) {
        this.heatStart = reading.timestamp;
      }      
    });
    if (this.heatStart) {
      heatBands.push([this.heatStart, this.currentReading.timestamp]);
    }
    this.chart.series[0].setData(dataTemp);
    this.chart.series[1].setData(dataTempUpstairs);
    this.chart.series[2].setData(dataSetTemp);
    this.chart.series[3].setData(dataOutsideTemp);
    heatBands.forEach(band => {
      this.addHeatPlotBand(band);
    });
    this.chartCreated = true;
  }

  updateChart(readings: any[]) {
    this.currentReading = readings[readings.length-1];
    if (!this.chartCreated) {
      this.createChart(readings);
      return;
    }  
    var lastReading = readings[readings.length-1];
    this.chart.series[0].addPoint([lastReading.timestamp,lastReading.one.temperature])
    this.chart.series[1].addPoint([lastReading.timestamp,lastReading.two.temperature])
    this.chart.series[2].addPoint([lastReading.timestamp,lastReading.targetTemperature])
    this.chart.series[3].addPoint([lastReading.timestamp,lastReading.temperatureOutside])
    if (this.currentReading.one.isHvacOn) {
      this.heatTime += 5;
    }
    if (this.heatStart) {      
      this.chart.xAxis[0].removePlotBand(this.heatStart);      
      this.addHeatPlotBand([this.heatStart, lastReading.timestamp]);
      if (!lastReading.one.isHvacOn) {
        this.heatStart = null;
      }
    }
    if (!this.heatStart && lastReading.one.isHvacOn) {
      this.heatStart = lastReading.timestamp;
      this.addHeatPlotBand([this.heatStart, this.heatStart]);
    }
  }

  addHeatPlotBand(band) {
    this.chart.xAxis[0].addPlotBand({
      id: band[0],
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

}
