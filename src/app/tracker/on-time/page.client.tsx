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
  avgDelayMin: number | null;
  medianDelayMin: number | null;
  maxDelayMin: number | null;
  p90DelayMin: number | null;
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
  routeId: string | null;
  overall: Aggregate;
  routeSummary: Aggregate | null;
  routes: RouteAggregate[];
  timeOfDay: TimeOfDayAggregate[];
  routeTimeOfDay: TimeOfDayAggregate[] | null;
}

interface OnTimeDataRequest {
  date: string;
  thresholdMinutes: number;
  includeCanceled: boolean;
  metric: Metric;
  routeId?: string;
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

function formatRatio(numerator: number, denominator: number): string {
  if (!denominator) return "n/a";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function formatMinutes(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "n/a";
  return `${value.toFixed(1)} min`;
}

const statTooltips = {
  onTimePct: "Percent of evaluated trips within the threshold.",
  avgDelay: "Average absolute delay for trips with a measured delay.",
  medianDelay: "Median absolute delay for trips with a measured delay.",
  p90Delay: "90th percentile of absolute delay.",
  maxDelay: "Largest absolute delay observed.",
  evaluatedCount: "Trips with delay data / total scheduled trips.",
  canceledPct: "Percent of scheduled trips marked as canceled."
};

function formatCount(numerator: number, denominator: number): string {
  return `${numerator}/${denominator}`;
}

const timeOfDayLabels: Record<string, string> = {
  early: "Overnight (00:00–05:00)",
  morning: "AM peak (05:00–09:00)",
  midday: "Midday (09:00–15:00)",
  evening: "PM peak (15:00–19:00)",
  late: "Evening (19:00–27:00)"
};

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

type CombinedRouteAggregate = Aggregate & { routeId: string };

function combineDirections(routes: RouteAggregate[]): CombinedRouteAggregate[] {
  const combined: Record<string, Aggregate> = {};
  for (const route of routes) {
    combined[route.routeId] ??= { totalScheduled: 0, evaluatedTrips: 0, onTimeTrips: 0, canceledTrips: 0 };
    combined[route.routeId].totalScheduled += route.totalScheduled;
    combined[route.routeId].evaluatedTrips += route.evaluatedTrips;
    combined[route.routeId].onTimeTrips += route.onTimeTrips;
    combined[route.routeId].canceledTrips += route.canceledTrips;
  }

  return Object.entries(combined).map(([routeId, agg]) => ({
    routeId,
    ...agg,
    onTimePct: agg.evaluatedTrips === 0 ? null : (agg.onTimeTrips / agg.evaluatedTrips) * 100
  }));
}

function sortCombinedRoutes(data: CombinedRouteAggregate[], sort: SortOptions): CombinedRouteAggregate[] {
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
          return aNum - bNum;
        }
        return a.routeId.localeCompare(b.routeId);
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
    metric: params.metric,
    ...(params.routeId ? { routeId: params.routeId } : {})
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

  const routeParam = searchParams.get("route");
  const [selectedRoute, setSelectedRoute] = useState<string | null>(routeParam);
  useEffect(() => {
    setSelectedRoute(routeParam);
  }, [routeParam]);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);

    getOnTimeData({
      date: dateToDateString(date),
      thresholdMinutes: threshold,
      includeCanceled,
      metric,
      routeId: selectedRoute ?? undefined
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
  }, [date, metric, threshold, includeCanceled, selectedRoute]);

  const combinedRoutes = data ? combineDirections(data.routes) : null;
  const sortedRoutes = combinedRoutes ? sortCombinedRoutes(combinedRoutes, sort) : null;
  const routeOptions: ComboboxOptions = combinedRoutes
    ? [{ value: "", label: "All routes" }, ...combinedRoutes.map((route) => ({
        value: route.routeId,
        label: `Route ${route.routeId}`
      }))]
    : [{ value: "", label: "All routes" }];

  const selectedRouteData = combinedRoutes && selectedRoute
    ? combinedRoutes.find((route) => route.routeId === selectedRoute)
    : null;

  const timeOfDayData = selectedRoute && data?.routeTimeOfDay ? data.routeTimeOfDay : data?.timeOfDay;

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
          <Combobox
            options={routeOptions}
            hintText="All routes"
            value={selectedRoute ?? ""}
            onChange={(v) => {
              router.push(getPageUrl(pathname, searchParams, {
                route: v ? v : null
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
            {!selectedRoute && (
              <div className="block-node on-time-table">
                <div className="block-node-title">
                  Overall on-time performance
                </div>
                <table>
                  <thead>
                    <tr>
                      <th title={statTooltips.onTimePct}>On-time %</th>
                      <th title={statTooltips.avgDelay}>Avg delay</th>
                      <th title={statTooltips.medianDelay}>Median</th>
                      <th title={statTooltips.p90Delay}>P90</th>
                      <th title={statTooltips.maxDelay}>Max</th>
                      <th title={statTooltips.evaluatedCount}>Evaluated</th>
                      <th title={statTooltips.canceledPct}>Canceled %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formatPercent(data.overall.onTimePct)}</td>
                      <td>{formatMinutes(data.overall.avgDelayMin)}</td>
                      <td>{formatMinutes(data.overall.medianDelayMin)}</td>
                      <td>{formatMinutes(data.overall.p90DelayMin)}</td>
                      <td>{formatMinutes(data.overall.maxDelayMin)}</td>
                      <td>{formatCount(data.overall.evaluatedTrips, data.overall.totalScheduled)}</td>
                      <td>{formatRatio(data.overall.canceledTrips, data.overall.totalScheduled)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {selectedRouteData && data.routeSummary && (
              <div className="block-node on-time-table">
                <div className="block-node-title">
                  Route {selectedRouteData.routeId}
                </div>
                <table>
                  <thead>
                    <tr>
                      <th title={statTooltips.onTimePct}>On-time %</th>
                      <th title={statTooltips.avgDelay}>Avg delay</th>
                      <th title={statTooltips.medianDelay}>Median</th>
                      <th title={statTooltips.p90Delay}>P90</th>
                      <th title={statTooltips.maxDelay}>Max</th>
                      <th title={statTooltips.evaluatedCount}>Evaluated</th>
                      <th title={statTooltips.canceledPct}>Canceled %</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{formatPercent(data.routeSummary.onTimePct)}</td>
                      <td>{formatMinutes(data.routeSummary.avgDelayMin)}</td>
                      <td>{formatMinutes(data.routeSummary.medianDelayMin)}</td>
                      <td>{formatMinutes(data.routeSummary.p90DelayMin)}</td>
                      <td>{formatMinutes(data.routeSummary.maxDelayMin)}</td>
                      <td>{formatCount(data.routeSummary.evaluatedTrips, data.routeSummary.totalScheduled)}</td>
                      <td>{formatRatio(data.routeSummary.canceledTrips, data.routeSummary.totalScheduled)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <div className="block-node on-time-table">
              <div className="block-node-title">
                Time of day
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Hours</th>
                    <th title={statTooltips.onTimePct}>On-time %</th>
                    <th title={statTooltips.avgDelay}>Avg delay</th>
                    <th title={statTooltips.medianDelay}>Median</th>
                    <th title={statTooltips.p90Delay}>P90</th>
                    <th title={statTooltips.maxDelay}>Max</th>
                    <th title={statTooltips.evaluatedCount}>Evaluated</th>
                    <th title={statTooltips.canceledPct}>Canceled %</th>
                  </tr>
                </thead>
                <tbody>
                  {timeOfDayData?.map((bucket) => (
                    <tr key={bucket.label}>
                      <td>{timeOfDayLabels[bucket.label] ?? bucket.label}</td>
                      <td>{formatPercent(bucket.onTimePct)}</td>
                      <td>{formatMinutes(bucket.avgDelayMin)}</td>
                      <td>{formatMinutes(bucket.medianDelayMin)}</td>
                      <td>{formatMinutes(bucket.p90DelayMin)}</td>
                      <td>{formatMinutes(bucket.maxDelayMin)}</td>
                      <td>{formatCount(bucket.evaluatedTrips, bucket.totalScheduled)}</td>
                      <td>{formatRatio(bucket.canceledTrips, bucket.totalScheduled)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!selectedRoute && (
            <div className="block-node on-time-table">
              <div className="block-node-title">
                Routes (percentages)
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th title={statTooltips.onTimePct}>On-time %</th>
                    <th title={statTooltips.avgDelay}>Avg delay</th>
                    <th title={statTooltips.medianDelay}>Median</th>
                    <th title={statTooltips.p90Delay}>P90</th>
                    <th title={statTooltips.maxDelay}>Max</th>
                    <th title={statTooltips.evaluatedCount}>Evaluated</th>
                    <th title={statTooltips.canceledPct}>Canceled %</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRoutes && sortedRoutes.map((route) => (
                    <tr key={route.routeId}>
                      <td>{route.routeId}</td>
                      <td>{formatPercent(route.onTimePct)}</td>
                      <td>{formatMinutes(route.avgDelayMin)}</td>
                      <td>{formatMinutes(route.medianDelayMin)}</td>
                      <td>{formatMinutes(route.p90DelayMin)}</td>
                      <td>{formatMinutes(route.maxDelayMin)}</td>
                      <td>{formatCount(route.evaluatedTrips, route.totalScheduled)}</td>
                      <td>{formatRatio(route.canceledTrips, route.totalScheduled)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </>
  );
}
