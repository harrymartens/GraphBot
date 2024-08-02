import { Component } from '@angular/core';
import { QueryServiceService } from '../../query-service.service';
import { FormControl } from '@angular/forms';
import { ChartConfiguration } from 'chart.js';
import Chart from 'chart.js/auto';
import { firstValueFrom } from 'rxjs';

type GraphObject = {
  X_AXIS_LABEL: string;
  Y_AXIS_LABEL: string;
  PLOT_TYPE: string;
};


@Component({
  selector: 'app-query-state',
  templateUrl: './query-state.component.html',
  styleUrl: './query-state.component.scss',
})
export class QueryStateComponent {
  inputQuery = new FormControl('');
  currentQuery: string = '';
  currentFile: File | null = null;
  fileName: string = 'No File Uploaded';
  parsedData: { [key: string]: string[] } | null = null;
  columnNames: string[] = [];
  chartConfig: any = null;
  chartId: string = `chart-${Math.random().toString(36).substr(2, 9)}`;
  loading: boolean = false;
  chart: Chart | null = null;
  plotTypes = ["scatter", "bar", "line", "doughnut"]

  isSpinning = false;


  constructor(private queryService: QueryServiceService) {}

  async ngOnInit() {
    this.currentQuery = this.queryService.getCurrentQuery();
    this.loading = this.queryService.loading;
    const file = this.queryService.getCurrentFile();
    if (file) {
      await this.importFile(file);
    }
    this.initializeChart();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.loading = true;
      await this.importFile(file);
      if (this.chart) {
        this.chart.destroy();
      }
      this.currentQuery = "Please provide a graphing query"
      this.loading = false;
    } else {
      console.error('No file selected');
    }
  }

  private async importFile(file: File) {
    this.currentFile = file;
    this.fileName = file.name;
    await this.readFile();
  }

  private readFile(): Promise<void> {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = () => {
        const result = fileReader.result;
        if (typeof result === 'string') {
          const lines = result.split('\n');
          this.parseData(lines);
          resolve();
        } else {
          console.error('Unexpected data type. Please provide a string.');
          reject(new Error('Unexpected data type'));
        }
      };
      if (this.currentFile) {
        fileReader.readAsText(this.currentFile);
      }
    });
  }

  private parseData(lines: string[]) {
    this.columnNames = lines[0].split(',').map(name => name.trim());
    this.parsedData = lines.slice(1).reduce((acc, line) => {
      const values = line.split(',');
      const key = values[0];
      acc[key] = values.slice(1).map(v => v.trim());
      return acc;
    }, {} as { [key: string]: string[] });
  }

  sendQuery() {
    const query = this.inputQuery.value;
    if (query) {
      this.queryService.addQuery(query);
      this.currentQuery = query;
      this.inputQuery.reset()
      this.initializeChart();

    } else {
      console.error('Please enter a query');
    }
  }

  regenerateResponse() {
    this.isSpinning = true;
    if (this.currentQuery) {
      setTimeout(() => {
        this.isSpinning = false;
      }, 1000); 
      this.initializeChart();

    }
  }

  private async initializeChart() {

    try {
      const graphQueryOptions = await firstValueFrom(this.queryService.mlPredict(this.currentQuery));
      console.log('Response from server:', graphQueryOptions);
      const matchedOptions = this.matchOptions(graphQueryOptions)
      this.parseChartData(matchedOptions);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  private levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    Math.min(
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                );
            }
        }
    }

    return matrix[b.length][a.length];
  }

  downloadImage() {
    if (this.chart) {
      var a = document.createElement('a');
      a.href = this.chart.toBase64Image()
      a.download = 'my_file_name.png';
      a.click()
    }
}

  private findMostSimilar(target: string, candidates: string[]): string {
    let minDistance = Infinity;
    let mostSimilar = "";

    for (const candidate of candidates) {
        const distance = this.levenshtein(target, candidate);
        if (distance < minDistance) {
            minDistance = distance;
            mostSimilar = candidate;
        }
    }

    return mostSimilar;
}

  private matchOptions( graphQueryOptions: GraphObject) : GraphObject {
    var adjustedColNames = []
    for (var col of this.columnNames){
      var cleanedCol = col.replace(/[()\[\]{}<> ]/g, "");
      adjustedColNames.push(cleanedCol.toLowerCase());
    }

    const similarX = this.findMostSimilar(graphQueryOptions.X_AXIS_LABEL, adjustedColNames);
    const similarY = this.findMostSimilar(graphQueryOptions.Y_AXIS_LABEL, adjustedColNames);
    const similarPlot = this.findMostSimilar(graphQueryOptions.PLOT_TYPE, this.plotTypes);
    const xPos = adjustedColNames.indexOf(similarX)
    const YPos = adjustedColNames.indexOf(similarY)
    const plotPos = this.plotTypes.indexOf(similarPlot)

    return {
      X_AXIS_LABEL: this.columnNames[xPos],
      Y_AXIS_LABEL: this.columnNames[YPos],
      PLOT_TYPE: this.plotTypes[plotPos],
    };

  }

  private parseChartData(graphQueryOptions: GraphObject) {
    if (!this.parsedData) {
      console.error('No data available');
      return;
    }
    const { X_AXIS_LABEL, Y_AXIS_LABEL, PLOT_TYPE } = graphQueryOptions;
    const xIndex = this.columnNames.indexOf(X_AXIS_LABEL);
    const yIndex = this.columnNames.indexOf(Y_AXIS_LABEL);

    if (xIndex === -1 || yIndex === -1) {
      console.error('Invalid axis labels');
      return;
    }

    const data = Object.entries(this.parsedData).map(([_, values]) => ({
      x: parseFloat(values[xIndex - 1]),
      y: parseFloat(values[yIndex - 1]),
    }));

    

    this.chartConfig = {
      type: PLOT_TYPE,
      data: {
        datasets: [{
          label: `${this.columnNames[xIndex]} vs ${this.columnNames[yIndex]}`,
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)', // Modern teal color with transparency
          borderColor: 'rgba(75, 192, 192, 1)', // Solid teal border
          pointBackgroundColor: 'rgba(75, 192, 192, 1)', // Point background color
          pointBorderColor: '#fff', // Point border color
          pointHoverBackgroundColor: '#fff', // Point hover background color
          pointHoverBorderColor: 'rgba(75, 192, 192, 1)' // Point hover border color
        }],
      },
      options: {
        scales: {
          x: {
            title: {
              display: true,
              text: this.columnNames[xIndex],
              color: "#e5e5e5"
            },
            grid: {
              color: 'rgba(200, 200, 200, 0.2)', // Light grey grid lines
            },
          },
          y: {
            title: {
              display: true,
              text: this.columnNames[yIndex],
              color: "#e5e5e5"
            },
            grid: {
              color: 'rgba(200, 200, 200, 0.2)', // Light grey grid lines
            },
          },
        },
        plugins: {
          legend: {
            labels: {
              color: '#e5e5e5', // Legend text color
              font: {
                size: 14, // Legend font size
                family: 'Arial, sans-serif', // Legend font family
              },
            },
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Tooltip background color
            titleColor: '#fff', // Tooltip title color
            bodyColor: '#fff', // Tooltip body color
            bodyFont: {
              size: 12, // Tooltip body font size
              family: 'Arial, sans-serif', // Tooltip body font family
            },
          },
        },
      },
      
    };

    this.renderChart();
  }

  private renderChart() {
    if (this.chart) {
      this.chart.destroy();
    }
    this.chartId = `chart-${Math.random().toString(36).substr(2, 9)}`;
    setTimeout(() => {
      const canvas = document.getElementById(this.chartId) as HTMLCanvasElement;
      if (canvas) {
        this.chart = new Chart(canvas, this.chartConfig!);
      }
    }, 0);
  }
  /*
  downloadImage() {
      if (this.chart) {
        var a = document.createElement('a');
        a.href = this.chart.toBase64Image()
        a.download = 'my_file_name.png';
        a.click()
      }
  }
  */
}
