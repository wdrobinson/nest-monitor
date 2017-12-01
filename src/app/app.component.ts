import { Component, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { AngularFireDatabase } from 'angularfire2/database';
import { Observable } from 'rxjs/Observable';
import { chart } from 'highcharts';
import * as Highcharts from 'highcharts';
import { AngularFireAuth } from 'angularfire2/auth';
import * as firebase from 'firebase/app';

@Component({
  selector: 'app-root',
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

  constructor(public db: AngularFireDatabase, public afAuth: AngularFireAuth) {
    afAuth.authState.subscribe((user) =>{
      if (!user) {
        this.login();
        return;
      }
      db.list('readings', ref => ref.limitToLast(2016)).valueChanges().subscribe((readings) => this.updateChart(readings));
    });
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

  login() {
    this.afAuth.auth.signInWithRedirect(new firebase.auth.GoogleAuthProvider());
  }

  logout() {
    this.afAuth.auth.signOut();
  }

}

var options = {
  global: {
    useUTC: false
  },
  colors: ['#2b908f', '#90ee7e', '#f45b5b', '#7798BF', '#aaeeee', '#ff0066',
     '#eeaaee', '#55BF3B', '#DF5353', '#7798BF', '#aaeeee'],
  chart: {
     backgroundColor: {
        linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
        stops: [
           [0, '#2a2a2b'],
           [1, '#3e3e40']
        ]
     },
     style: {
      fontFamily: '\'Unica One\', sans-serif'
    },
     plotBorderColor: '#606063'
  },
  title: {
     style: {
        color: '#E0E0E3',
        textTransform: 'uppercase',
        fontSize: '20px'
     }
  },
  subtitle: {
     style: {
        color: '#E0E0E3',
        textTransform: 'uppercase'
     }
  },
  xAxis: {
     gridLineColor: '#707073',
     labels: {
        style: {
           color: '#E0E0E3'
        }
     },
     lineColor: '#707073',
     minorGridLineColor: '#505053',
     tickColor: '#707073',
     title: {
        style: {
           color: '#A0A0A3'

        }
     }
  },
  yAxis: {
     gridLineColor: '#707073',
     labels: {
        style: {
           color: '#E0E0E3'
        }
     },
     lineColor: '#707073',
     minorGridLineColor: '#505053',
     tickColor: '#707073',
     tickWidth: 1,
     title: {
        style: {
           color: '#A0A0A3'
        }
     }
  },
  tooltip: {
     backgroundColor: 'rgba(0, 0, 0, 0.85)',
     style: {
        color: '#F0F0F0'
     }
  },
  plotOptions: {
     series: {
        dataLabels: {
           color: '#B0B0B3'
        },
        marker: {
           lineColor: '#333'
        }
     },
     boxplot: {
        fillColor: '#505053'
     },
     candlestick: {
        lineColor: 'white'
     },
     errorbar: {
        color: 'white'
     }
  },
  legend: {
     itemStyle: {
        color: '#E0E0E3'
     },
     itemHoverStyle: {
        color: '#FFF'
     },
     itemHiddenStyle: {
        color: '#606063'
     }
  },
  credits: {
     style: {
        color: '#666'
     }
  },
  labels: {
     style: {
        color: '#707073'
     }
  },

  drilldown: {
     activeAxisLabelStyle: {
        color: '#F0F0F3'
     },
     activeDataLabelStyle: {
        color: '#F0F0F3'
     }
  },

  navigation: {
     buttonOptions: {
        symbolStroke: '#DDDDDD',
        theme: {
           fill: '#505053'
        }
     }
  },

  // scroll charts
  rangeSelector: {
     buttonTheme: {
        fill: '#505053',
        stroke: '#000000',
        style: {
           color: '#CCC'
        },
        states: {
           hover: {
              fill: '#707073',
              stroke: '#000000',
              style: {
                 color: 'white'
              }
           },
           select: {
              fill: '#000003',
              stroke: '#000000',
              style: {
                 color: 'white'
              }
           }
        }
     },
     inputBoxBorderColor: '#505053',
     inputStyle: {
        backgroundColor: '#333',
        color: 'silver'
     },
     labelStyle: {
        color: 'silver'
     }
  },

  navigator: {
     handles: {
        backgroundColor: '#666',
        borderColor: '#AAA'
     },
     outlineColor: '#CCC',
     maskFill: 'rgba(255,255,255,0.1)',
     series: {
        color: '#7798BF',
        lineColor: '#A6C7ED'
     },
     xAxis: {
        gridLineColor: '#505053'
     }
  },

  scrollbar: {
     barBackgroundColor: '#808083',
     barBorderColor: '#808083',
     buttonArrowColor: '#CCC',
     buttonBackgroundColor: '#606063',
     buttonBorderColor: '#606063',
     rifleColor: '#FFF',
     trackBackgroundColor: '#404043',
     trackBorderColor: '#404043'
  },

  // special colors for some of the
  legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
  background2: '#505053',
  dataLabelsColor: '#B0B0B3',
  textColor: '#C0C0C0',
  contrastTextColor: '#F0F0F3',
  maskColor: 'rgba(255,255,255,0.3)'
};

// Apply the theme
Highcharts.setOptions(options);
