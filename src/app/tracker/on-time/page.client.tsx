"use client";
import { busTrackerServerUrl, dateStringToServiceDay, dateToDateString, getCurrentDate } from "@/utils/busTracker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

import { getPageUrl } from "@/utils/pageNavigation";
import { DatePicker } from "@/components/DatePicker";
import Combobox, { ComboboxOptions } from "@/components/ComboBox";
import { Slider } from "@/components/ui/slider";
import { HelpCircleIcon } from "lucide-react";

type Metric = "avgObserved" | "start";

interface Aggregate {
  totalScheduled: number;
  evaluatedTrips: number;
  onTimeTrips: number;
  canceledTrips: number;
  onTimePct: number | null;
}

interface RouteAggregate extends Aggregate {
  routeId: string;
  direction: number;
}

interface TimeOfDayAggregate extends Aggregate {
  label: string;
}

interface OnTimePerformanceResponse {
  date: string;
  metric: Metric;
  thresholdMinutes: number;
  includeCanceled: boolean;
  overall: Aggregate;
  routes: RouteAggregate[];
  timeOfDay: TimeOfDayAggregate[];
}

interface OnTimeDataRequest {
  date: string;
  thresholdMinutes: number;
  includeCanceled: boolean;
  metric: Metric;
}

const DEFAULT_THRESHOLD = 5;
const MAX_THRESHOLD = 30;

enum SortOptions {
  Route = "route",
  Best = "best",
  Worst = "worst",
  Canceled = "canceled"
}

const metricOptions: ComboboxOptions = [
  { value: "avgObserved", label: "Average observed delay" },
  { value: "start", label: "First observed start" }
];

const sortOptions: ComboboxOptions = [
  { value: SortOptions.Route, label: "Sort by route" },
  { value: SortOptions.Best, label: "Best on-time %" },
  { value: SortOptions.Worst, label: "Worst on-time %" },
  { value: SortOptions.Canceled, label: "Most canceled" }
];

function parseMetric(value: string | null): Metric {
  return value === "start" ? "start" : "avgObserved";
}

function parseSort(value: string | null): SortOptions {
  switch (value) {
    case SortOptions.Best:
    case SortOptions.Worst:
    case SortOptions.Canceled:
      return value;
    default:
      return SortOptions.Route;
  }
}

function parseThreshold(value: string | null): number {
  if (!value) return DEFAULT_THRESHOLD;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_THRESHOLD;
  return Math.min(MAX_THRESHOLD, Math.max(1, Math.round(parsed)));
}

function parseIncludeCanceled(value: string | null): boolean {
  return value === "1" || value === "true";
}

function formatPercent(pct: number | null): string {
  return pct === null ? "n/a" : `${pct.toFixed(1)}%`;
}

function sortRoutes(data: RouteAggregate[], sort: SortOptions): RouteAggregate[] {
  const sorted = [...data];
  switch (sort) {
    case SortOptions.Best:
      sorted.sort((a, b) => (b.onTimePct ?? -1) - (a.onTimePct ?? -1));
      break;
    case SortOptions.Worst:
      sorted.sort((a, b) => (a.onTimePct ?? 101) - (b.onTimePct ?? 101));
      break;
    case SortOptions.Canceled:
      sorted.sort((a, b) => b.canceledTrips - a.canceledTrips);
      break;
    case SortOptions.Route:
    default:
      sorted.sort((a, b) => {
        const aNum = parseInt(a.routeId, 10);
        const bNum = parseInt(b.routeId, 10);
        if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
          return aNum - bNum || a.direction - b.direction;
        }
        return a.routeId.localeCompare(b.routeId) || a.direction - b.direction;
      });
      break;
  }

  return sorted;
}

async function getOnTimeData(params: OnTimeDataRequest): Promise<OnTimePerformanceResponse | null> {
  const query = new URLSearchParams({
    date: params.date,
    thresholdMinutes: String(params.thresholdMinutes),
    includeCanceled: String(params.includeCanceled),
    metric: params.metric
  });
  const result = await fetch(`${busTrackerServerUrl}/api/on-time-performance?${query.toString()}`);
  if (!result.ok) {
    return null;
  }

  return await result.json();
}

export default function PageClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [date, setDate] = useState<Date>(dateStringToServiceDay((searchParams.get("date") ? searchParams.get("date")! : dateToDateString(getCurrentDate()))));
  useEffect(() => {
    const newDate = searchParams.get("date") || dateToDateString(getCurrentDate());
    if (newDate) {
      const parsed = dateStringToServiceDay(newDate);
      if (parsed.getTime() !== date.getTime()) {
        setDate(parsed);
      }
    }
  }, [searchParams, date]);

  const [metric, setMetric] = useState<Metric>(parseMetric(searchParams.get("metric")));
  useEffect(() => {
    const newMetric = parseMetric(searchParams.get("metric"));
    if (newMetric !== metric) {
      setMetric(newMetric);
    }
  }, [searchParams, metric]);

  const [sort, setSort] = useState<SortOptions>(parseSort(searchParams.get("sort")));
  useEffect(() => {
    const newSort = parseSort(searchParams.get("sort"));
    if (newSort !== sort) {
      setSort(newSort);
    }
  }, [searchParams, sort]);

  const thresholdParam = searchParams.get("threshold");
  const [threshold, setThreshold] = useState<number>(parseThreshold(thresholdParam));
  useEffect(() => {
    const newThreshold = parseThreshold(thresholdParam);
    setThreshold(newThreshold);
  }, [thresholdParam]);

  const [includeCanceled, setIncludeCanceled] = useState<boolean>(parseIncludeCanceled(searchParams.get("includeCanceled")));
  useEffect(() => {
    const newValue = parseIncludeCanceled(searchParams.get("includeCanceled"));
    if (newValue !== includeCanceled) {
      setIncludeCanceled(newValue);
    }
  }, [searchParams, includeCanceled]);

  const [data, setData] = useState<OnTimePerformanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    getOnTimeData({
      date: dateToDateString(date),
      thresholdMinutes: threshold,
      includeCanceled,
      metric
    }).then((result) => {
      if (cancelled) return;
      if (result) {
        setData(result);
      } else {
        setError("No data available for the selected date.");
      }
    }).catch(() => {
      if (!cancelled) {
        setError("Failed to load on-time performance data.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [date, metric, threshold, includeCanceled]);

  const sortedRoutes = data ? sortRoutes(data.routes, sort) : null;

  return (
    <>
      <div className="controls with-padding on-time-controls">
        <div className="control-boxes">
          <Combobox
            options={metricOptions}
            hintText="Select metric..."
            value={metric}
            onChange={(v) => {
              router.push(getPageUrl(pathname, searchParams, {
                metric: v === "avgObserved" ? null : v
              }));
            }}
          />
          <Combobox
            options={sortOptions}
            hintText="Select sort..."
            value={sort}
            onChange={(v) => {
              router.push(getPageUrl(pathname, searchParams, {
                sort: v === SortOptions.Route ? null : v
              }));
            }}
          />
        </div>

        <div className="control-boxes">
          <label className="on-time-toggle">
            <input
              type="checkbox"
              checked={includeCanceled}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                router.push(getPageUrl(pathname, searchParams, {
                  includeCanceled: e.target.checked ? "true" : null
                }));
              }}
            />
            Include canceled trips
          </label>

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
        </div>

        <details className="advanced-options">
          <summary>Advanced</summary>
          <div>
            On-time threshold: <strong>{threshold} min</strong>
            <Slider
              value={[threshold]}
              onValueChange={(v: number[]) => {
                const next = Math.min(MAX_THRESHOLD, Math.max(1, Math.round(v[0] ?? DEFAULT_THRESHOLD)));
                setThreshold(next);
              }}
              onValueCommit={(v: number[]) => {
                const next = Math.min(MAX_THRESHOLD, Math.max(1, Math.round(v[0] ?? DEFAULT_THRESHOLD)));
                router.push(getPageUrl(pathname, searchParams, {
                  threshold: next === DEFAULT_THRESHOLD ? null : String(next)
                }));
              }}
              max={MAX_THRESHOLD}
              min={1}
              step={1}
              className="slider"
            />
          </div>
        </details>

        <details className="what-is-this">
          <summary>
            <HelpCircleIcon/>What is this?
          </summary>

          <p>
            This page measures how often buses are on time. The default metric uses the average observed delay for each trip. You can also switch to “first observed start,” which compares the first time a trip was seen to its scheduled start time.
          </p>

          <p>
            Trips are considered on-time if their delay is within the selected threshold in minutes. You can include canceled trips if you want to count them in the totals.
          </p>
        </details>
      </div>

      {error && (
        <div className="on-time-empty">{error}</div>
      )}

      {!error && !data && (
        <div className="on-time-empty">Loading on-time performance...</div>
      )}

      {data && (
        <>
          <div className="on-time-summary">
            <div className="block-node on-time-table">
              <div className="block-node-title">
                Overall on-time performance
              </div>
              <table>
                <thead>
                  <tr>
                    <th>On-time %</th>
                    <th>On-time</th>
                    <th>Evaluated</th>
                    <th>Canceled</th>
                    <th>Scheduled</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{formatPercent(data.overall.onTimePct)}</td>
                    <td>{data.overall.onTimeTrips}</td>
                    <td>{data.overall.evaluatedTrips}</td>
                    <td>{data.overall.canceledTrips}</td>
                    <td>{data.overall.totalScheduled}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="block-node on-time-table">
              <div className="block-node-title">
                Time of day
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Bucket</th>
                    <th>On-time %</th>
                    <th>On-time</th>
                    <th>Evaluated</th>
                    <th>Canceled</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeOfDay.map((bucket) => (
                    <tr key={bucket.label}>
                      <td>{bucket.label}</td>
                      <td>{formatPercent(bucket.onTimePct)}</td>
                      <td>{bucket.onTimeTrips}</td>
                      <td>{bucket.evaluatedTrips}</td>
                      <td>{bucket.canceledTrips}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="block-node on-time-table">
            <div className="block-node-title">
              Routes
            </div>
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Direction</th>
                  <th>On-time %</th>
                  <th>On-time</th>
                  <th>Evaluated</th>
                  <th>Canceled</th>
                  <th>Scheduled</th>
                </tr>
              </thead>
              <tbody>
                {sortedRoutes && sortedRoutes.map((route) => (
                  <tr key={`${route.routeId}-${route.direction}`}>
                    <td>{route.routeId}</td>
                    <td>{route.direction}</td>
                    <td>{formatPercent(route.onTimePct)}</td>
                    <td>{route.onTimeTrips}</td>
                    <td>{route.evaluatedTrips}</td>
                    <td>{route.canceledTrips}</td>
                    <td>{route.totalScheduled}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
