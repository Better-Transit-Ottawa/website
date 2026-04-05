"use client";
import { busTrackerServerUrl, dateStringToServiceDay } from "@/utils/busTracker";
import { useEffect, useState } from "react";

import { HelpCircleIcon } from "lucide-react";
import { ChartData, Chart, registerables, ChartOptions, TooltipItem } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import { verticalHoverLine } from "@/utils/chartVerticalHoverLine";

Chart.register(...registerables);
Chart.defaults.color = "#fff";

interface BusCountData {
    date: string;
    cancelations: number;
    missingTrips: number;
    delayedTrips: number;
    busTypes: Record<string, number>;
    busHours: Record<string, number>;
}

async function getBusCountData(): Promise<BusCountData[] | null> {
  const request = await fetch(`${busTrackerServerUrl}/api/historicalCount`, );
  if (request.ok) {
    const data = await request.json() as BusCountData[];
    return data
  }

  return null;
}

async function getCancelationGraph(data: BusCountData[]): Promise<ChartData<"line"> | null> {
  return {
    labels: data.map((d) => d.date),
    datasets: [{
      label: "Trips removed from schedule",
      data: data.map((d) => d.missingTrips),
      yAxisID: "yAxis",
      borderColor: "#fa9a00",
      backgroundColor: "#fa9a0050",
      fill: "stack"
    }, {
      label: "Cancellations",
      data: data.map((d) => d.cancelations),
      yAxisID: "yAxis",
      borderColor: "red",
      backgroundColor: "#ff000030",
      fill: "stack"
    }]
  };
}

async function getBusCountGraph(data: BusCountData[]): Promise<ChartData<"line"> | null> {
  return {
    labels: data.map((d) => d.date),
    datasets: [{
      label: "EV Novabus",
      data: data.map((d) => d.busTypes["LFSe+"]),
      yAxisID: "yAxis",
      borderColor: "#00ff37ff",
      backgroundColor: "#00ff3763",
      fill: "stack"
    }, {
      label: "EV New Flyer",
      data: data.map((d) => d.busTypes["XE40"]),
      yAxisID: "yAxis",
      borderColor: "#51b218ff",
      backgroundColor: "#50b2185a",
      fill: "stack"
    }, {
      label: "2019 Nova Bus",
      data: data.map((d) => d.busTypes["LFS"]),
      yAxisID: "yAxis",
      borderColor: "#0060faff",
      backgroundColor: "#0060fa50",
      fill: "stack"
    }, {
      label: "GRT Used Nova Bus",
      data: data.map((d) => d.busTypes["LFS-GRT"]),
      yAxisID: "yAxis",
      borderColor: "#a000fcff",
      backgroundColor: "#a000fc44",
      fill: "stack"
    }, {
      label: "Artic",
      data: data.map((d) => d.busTypes["D60LFR"]),
      yAxisID: "yAxis",
      borderColor: "#fa00f2ff",
      backgroundColor: "#fa00f25b",
      fill: "stack"
    }, {
      label: "Older Artic",
      data: data.map((d) => d.busTypes["D60LF"]),
      yAxisID: "yAxis",
      borderColor: "#b11fadff",
      backgroundColor: "#b11fac5f",
      fill: "stack"
    }, {
      label: "Double decker",
      data: data.map((d) => d.busTypes["Enviro500"]),
      yAxisID: "yAxis",
      borderColor: "#fa0000ff",
      backgroundColor: "#fa000045",
      fill: "stack"
    }, {
      label: "Invero",
      data: data.map((d) => d.busTypes["D40i"]),
      yAxisID: "yAxis",
      borderColor: "#5fb6a9ff",
      backgroundColor: "#5fb6a951",
      fill: "stack"
    }].reverse()
  };
}

export default function PageClient() {
  const [busCountData, setBusCountData] = useState<BusCountData[]>([]);
  const [busCountDataFiltered, setBusCountDataFiltered] = useState<BusCountData[]>([]);
  useEffect(() => {
    getBusCountData().then((data) => {
      if (data) {
        setBusCountData(data);
      }
    });
  }, []);

  const [excludeWeekends, setExcludeWeekends] = useState(true);
  const [excludeHolidays, setExcludeHolidays] = useState(true);
  useEffect(() => {
    if (busCountData) {
      setBusCountDataFiltered(busCountData.filter((v) => (!excludeWeekends || !isWeekend(v.date)) 
        && (!excludeHolidays || !isHoliday(v.date))))
    }
  }, [excludeHolidays, excludeWeekends, busCountData]);

  return (
    <>
      <div className="controls with-padding">
        <details className="advanced-options">
          <summary>Advanced</summary>

          <div>
            Exclude weekends{" "}
            <input
              type="checkbox"
              checked={excludeWeekends}
              onChange={() => {
                setExcludeWeekends(!excludeWeekends);
              }}
            />
          </div>
          <div>
            Exclude holidays{" "}
            <input
              type="checkbox"
              checked={excludeHolidays}
              onChange={() => {
                setExcludeHolidays(!excludeHolidays);
              }}
            />
          </div>
        </details>

        <details className="what-is-this">
          <summary>
            <HelpCircleIcon/>What is this?
          </summary>

          <p>
            The first graph shows the cancellations and trips missing per day, excluding weekends.
            Cancellations are trips reported as cancelled by OC Transpo.
            Trips removed are the number of trips that have been removed from the schedule since the schedule published on January 6th 2026.
          </p>

          <p>
            The second graph shows the number of buses of each bus type active per day.
            In this graph, you can see when buses may have been pulled due to repair, breakdowns or lack of available chargers.
          </p>

          <p>
            School routes (600-series), and event routes (400-series) are excluded from the cancellation and removed trip numbers.
          </p>

        </details>
      </div>

      <Cancelations
        data={busCountDataFiltered}
      />

      <BusCount
        data={busCountDataFiltered}
      />
    </>
  );
}

const tooltipFooter = (tooltipItems: TooltipItem<"line">[]) => {
  return `Total: ${tooltipItems.reduce((p, c) => p + c.parsed.y!, 0)}`;
}

interface GraphProps {
  data: BusCountData[];
}

function Cancelations({ data }: GraphProps) {
  const [busCountGraphData, setBusCountGraphData] = useState<ChartData<"line"> | null>(null);
  const [busCountGraphOptions, setBusCountGraphOptions] = useState<ChartOptions<"line"> | null>(null);
  useEffect(() => {
    setBusCountGraphData(null);
    setBusCountGraphOptions(getChartOptions("Cancellations over time"));

    if (data) {
      getCancelationGraph(data).then(setBusCountGraphData);
    }
  }, [data]);

  return (
    <div className="route-tables">
      <div className="chart">
        {busCountGraphData && busCountGraphOptions &&
          <Line
            options={busCountGraphOptions}
            data={busCountGraphData}
            plugins={[verticalHoverLine]} />
        }
      </div>
    </div>
  );
}

function BusCount({ data }: GraphProps) {
  const [busCountGraphData, setBusCountGraphData] = useState<ChartData<"line"> | null>(null);
  const [busCountGraphOptions, setBusCountGraphOptions] = useState<ChartOptions<"line"> | null>(null);
  useEffect(() => {
    setBusCountGraphData(null);
    setBusCountGraphOptions(getChartOptions("Buses in service"));

    if (data) {
      getBusCountGraph(data).then(setBusCountGraphData);
    }
  }, [data]);

  return (
    <div className="route-tables">
      <div className="chart">
        {busCountGraphData && busCountGraphOptions &&
          <Line
            options={busCountGraphOptions}
            data={busCountGraphData}
            plugins={[verticalHoverLine]} />
        }
      </div>
    </div>
  );
}

function isWeekend(date: string): boolean {
  const dateObj = dateStringToServiceDay(date);
  return [0, 6].includes(dateObj.getDay());
}

function isHoliday(date: string): boolean {
  return [
    "2026-04-04",
  ].includes(date)
}

function getChartOptions(name: string): ChartOptions<"line"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    devicePixelRatio: 1,
    scales: {
      yAxis: {
        ticks: {
          font: {
            size: 16
          }
        },
        beginAtZero: true,
        stacked: true
      }
    },
    interaction: {
      mode: "index",
      axis: "x",
      intersect: false
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 16
          }
        }
      },
      title: {
        display: true,
        text: name,
        font: {
          size: 20
        }
      },
      tooltip: {
        titleFont: {
          size: 25
        },
        bodyFont: {
          size: 16
        },
        footerFont: {
          size: 25
        },
        callbacks: {
          footer: tooltipFooter
        },
        itemSort: (a, b) => {
          return b.datasetIndex - a.datasetIndex;
        }
      }
    },
  };
}