"use client";
import { busTrackerServerUrl, dateStringToServiceDay, dateToDateString } from "@/utils/busTracker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getPageUrl } from "@/utils/pageNavigation";
import { DatePicker } from "@/components/DatePicker";
import { HelpCircleIcon } from "lucide-react";
import { BadDataWarning } from "@/app/components/bad-data-warning";
import { ChartData, Chart, registerables, ChartOptions, TooltipItem } from "chart.js/auto";
import { Line } from "react-chartjs-2";
import { verticalHoverLine } from "@/utils/chartVerticalHoverLine";

Chart.register(...registerables);
Chart.defaults.color = "#fff";

interface BusCountData {
    activeBuses: number;
    busesOnRoutes: number;
    tripsScheduled: number;
    tripsNotRunning: number;
    tripsNeverRan: number;
    tripsCanceled: number;
    tripsStillRunning: number;
}

interface BusCountGraph extends BusCountData {
    time: string;
}

interface BusCountGraphDataRequest {
  date: string;
};

async function getBusCountGraph(params: BusCountGraphDataRequest): Promise<ChartData<"line"> | null> {
  const request = await fetch(`${busTrackerServerUrl}/api/activeBusesGraph?${new URLSearchParams(params as unknown as Record<string, string>)}`, );
  if (request.ok) {
    const data = await request.json() as BusCountGraph[];

    return {
      labels: data.map((d) => d.time),
      datasets: [{
        label: "Scheduled trips",
        data: data.map((d) => d.tripsScheduled),
        yAxisID: "yAxis",
        borderColor: "#00ca61",
        backgroundColor: "#00ca6150"
      }, {
        label: "Buses needed for service",
        data: data.map((d) => d.tripsScheduled + d.tripsStillRunning),
        yAxisID: "yAxis",
        borderColor: "#00d4fa",
        backgroundColor: "#00d4fa50",
        fill: 2
      }, {
        label: "Buses on routes",
        data: data.map((d) => d.busesOnRoutes),
        yAxisID: "yAxis",
        borderColor: "#0055ff",
        backgroundColor: "#0055ff50"
      }, {
        label: "Delayed trips still running",
        data: data.map((d) => d.tripsStillRunning),
        yAxisID: "yAxis",
        borderColor: "#d6c400",
        backgroundColor: "#fa9a0050"
      }, {
        label: "Scheduled trips not running",
        data: data.map((d) => d.tripsNotRunning),
        yAxisID: "yAxis",
        borderColor: "#fa9a00",
        backgroundColor: "#fa9a0050"
      }, {
        label: "Scheduled trips that are cancelled",
        data: data.map((d) => d.tripsCanceled),
        yAxisID: "yAxis",
        borderColor: "red",
        backgroundColor: "#ff000030",
        hidden: true
      }]
    }
  }

  return null;
}

export default function PageClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [date, setDate] = useState<Date>(dateStringToServiceDay((searchParams.get("date") ? searchParams.get("date")! : dateToDateString(getCurrentDate()))));
  useEffect(() => {
    const newDate = searchParams.get("date") || dateToDateString(getCurrentDate());
    if (newDate) {
      if (dateStringToServiceDay(newDate).getTime() !== date.getTime()) {
        setDate(dateStringToServiceDay(newDate));
      }
    }
  }, [searchParams, date]);

  return (
    <>
      <div className="controls with-padding">
        <DatePicker
          date={date}
          dateUpdated={(d) => {
            if (d) {
              const dateString = dateToDateString(d);
              if (dateString !== dateToDateString(getCurrentDate())) {
                router.push(getPageUrl(pathname, searchParams, {
                  date: dateToDateString(d)
                }));
              } else {
                router.push(getPageUrl(pathname, searchParams, {
                  date: null
                }));
              }
            }
          }}
        />

        <details className="what-is-this">
          <summary>
            <HelpCircleIcon/>What is this?
          </summary>

          <p>
            OC Transpo is facing a significant bus shortage. Because of this, many trips never get a bus assigned, and buses have to be re-assigned throughout the day. This causes many trip cancellations.
          </p>

          <p>
            This page shows the bus availability status at different times throughout the day.
          </p>

          <p>
            Buses needed for service: The number of buses that it is estimated we would need to avoid any cancellations or delayed buses. This is calculated by adding the number of scheduled buses and number of delayed trips still running.
          </p>

          <p>
            Buses on routes: The number of buses actively out on the road completing a trip. This does not include buses on breaks, or driving somewhere to start their next route.
          </p>

          <p>
            Scheduled trips: The number of trips scheduled to be running at a particular time.
          </p>

          <p>
            Delayed trips still running: The number of trips that should have ended already, but are still actively in service due to delays. This causes buses to be unavailable for the next scheduled trip.
          </p>

          <p>
            Scheduled trips not running: The number of trips that should have started, but have not started yet. These trips may either be cancelled, or start late.
          </p>

          <p>
            Scheduled trips that are cancelled: The number of trips that have been reported as cancelled by OC transpo at a particular time.
          </p>

          <p>
            Bus deficit: This is the area shaded in light blue. This is the difference between the number of buses on the road and the estimated number of buses needed for service.
          </p>
        </details>

        <BadDataWarning date={date} cancellations={true}/>
      </div>
      <CurrentDay
        date={date}
      />
    </>
  );
}

const tooltipFooter = (tooltipItems: TooltipItem<"line">[]) => {
  return tooltipItems[1] 
    && tooltipItems[2]
    && tooltipItems[1].datasetIndex === 1
    && tooltipItems[2].datasetIndex === 2 ?  `Bus deficit: ${tooltipItems[1].parsed.y! - tooltipItems[2].parsed.y!} buses` : "";
}

interface CurrentDayProps {
  date: Date;
}

function CurrentDay({ date }: CurrentDayProps) {
  const [busCountGraphData, setBusCountGraphData] = useState<ChartData<"line"> | null>(null);
  const [busCountGraphOptions, setBusCountGraphOptions] = useState<ChartOptions<"line"> | null>(null);
  useEffect(() => {
    setBusCountGraphData(null);
    setBusCountGraphOptions({
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
          text: `Bus counts on ${date.toDateString()}`,
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
          }
        }
      },
    });

    if (date.getTime() - new Date().getTime() < 0
        && date.getTime() - new Date(2026, 0, 5).getTime() >= 0) {
      getBusCountGraph({
        date: date.toISOString(),
      }).then(setBusCountGraphData);
    }
  }, [date]);

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

function getCurrentDate(): Date {
    const date = new Date();

    // Special one here because otherwise it would be blank at 3 AM
    if (date.getHours() < 4) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1);
    }

    return date;
}