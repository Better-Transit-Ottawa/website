"use client";
import { busTrackerServerUrl, dateStringToServiceDay, dateToDateString, getCurrentDate, secondsToMinuteAndSeconds, timeStringDiff, timeStringWithinRange, TripDetails } from "@/utils/busTracker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Combobox, { ComboboxOptions } from "@/components/ComboBox";
import { getPageUrl } from "@/utils/pageNavigation";
import Link from "next/link";
import { HelpCircleIcon } from "lucide-react";
import { BadDataWarning } from "@/app/components/bad-data-warning";

interface ChangeData {
  before: TripDetails[];
  after: TripDetails[];
}

enum ServiceChange {
  SummerMonday = "summer26Mon",
  SummerFriday = "summer26Fri",
  SummerSaturday = "summer26Sat",
  SummerSunday = "summer26Sun",
  CanadaDay = "canada26",
}

const serviceChanges = {
  [ServiceChange.SummerMonday]: {
    before: "2026-06-22",
    after: "2026-06-29",
  },
  [ServiceChange.SummerFriday]: {
    before: "2026-06-26",
    after: "2026-07-03",
  },
  [ServiceChange.SummerSaturday]: {
    before: "2026-06-20",
    after: "2026-07-04",
  },
  [ServiceChange.SummerSunday]: {
    before: "2026-06-21",
    after: "2026-06-28",
  },
  [ServiceChange.CanadaDay]: {
    before: "2026-06-22",
    after: "2026-07-01",
  }
};

const serviceChangeOptions = [{
  value: ServiceChange.SummerMonday,
  label: "Summer Monday"
}, {
  value: ServiceChange.SummerFriday,
  label: "Summer Friday"
}, {
  value: ServiceChange.SummerSaturday,
  label: "Summer Saturday"
}, {
  value: ServiceChange.SummerSunday,
  label: "Summer Sunday"
}];

const directionOptions = [{
  value: "0",
  label: "Direction 1"
}, {
  value: "1",
  label: "Direction 2"
}];


interface TripTableData {
  oldBlockId: string | null;
  newBlockId: string | null;
  oldTripId: string | null;
  newTripId: string | null;
  headSign: string;
  oldStart: string | null;
  oldGap?: number | null;
  newStart: string| null;
  newGap?: number | null;
}

function getTripTableData(changeData: ChangeData): TripTableData[] {
  const result: TripTableData[] = [];

  let beforeIndex = 0;
  let afterIndex = 0;
  while (beforeIndex < changeData.before.length || afterIndex < changeData.after.length) {
    // check if next one is more than the last gap

    const leftTrip = changeData.before[beforeIndex];
    const rightTrip = changeData.after[afterIndex];

    const timeDiff = (leftTrip && rightTrip) ? timeStringDiff(leftTrip.scheduledStartTime, rightTrip.scheduledStartTime) : null;
    if (timeDiff !== null && (timeDiff === 0 || Math.abs(timeDiff) < 12 * 60) && leftTrip.shapeId === rightTrip.shapeId.replace(/-1$/, "")) {
      result.push({
        oldBlockId: leftTrip.blockId,
        oldTripId: leftTrip.tripId,
        oldStart: leftTrip.scheduledStartTime,
        headSign: leftTrip.headSign === rightTrip.headSign ? leftTrip.headSign : `${leftTrip.headSign} / ${rightTrip.headSign}`,
        newBlockId: rightTrip.blockId,
        newTripId: rightTrip.tripId,
        newStart: rightTrip.scheduledStartTime
      });

      beforeIndex++;
      afterIndex++;
    } else if ((timeDiff === null && rightTrip) || (timeDiff !== null && timeDiff > 0)) {
      result.push({
        oldBlockId: null,
        oldTripId: null,
        oldStart: null,
        headSign: rightTrip.headSign,
        newBlockId: rightTrip.blockId,
        newTripId: rightTrip.tripId,
        newStart: rightTrip.scheduledStartTime
      });

      afterIndex++;
    } else {
      result.push({
        oldBlockId: leftTrip.blockId,
        oldTripId: leftTrip.tripId,
        oldStart: leftTrip.scheduledStartTime,
        headSign: leftTrip.headSign,
        newBlockId: null,
        newTripId: null,
        newStart: null
      });

      beforeIndex++;
    }
  }

  let lastOldStart = "";
  let lastNewStart = "";
  for (const item of result) {
    if (lastOldStart && item.oldStart) {
      item.oldGap = timeStringDiff(item.oldStart, lastOldStart);
    }
    if (item.oldStart) {
      lastOldStart = item.oldStart;
    }

    if (lastNewStart && item.newStart) {
      item.newGap = timeStringDiff(item.newStart, lastNewStart);
    }
    if (item.newStart) {
      lastNewStart = item.newStart;
    }
  }

  return result;
}

interface RouteChangeSummary {
  name: string;
  before: number;
  after: number;
  change: number;
  display: (v: number) => string;
  colorPercent: (v: number) => number;
}

function getChangeSummary(tripTable: TripTableData[]): RouteChangeSummary[] {
  const result: RouteChangeSummary[] = [];

  result.push({
    name: "Total trips",
    before: tripTable.reduce((acc, t) => {
        if (t.oldBlockId) acc++;
        return acc;
      }, 0),
    after: tripTable.reduce((acc, t) => {
        if (t.newBlockId) acc++;
        return acc;
      }, 0),
    change: 0,
    display: (v) => String(v),
    colorPercent: (v) => - (v / 10)
  });

  result.push({
    name: "Average gap",
    before: findAverage(tripTable.filter((t) => t.oldGap).map((t) => t.oldGap!)),
    after: findAverage(tripTable.filter((t) => t.newGap).map((t) => t.newGap!)),
    change: 0,
    display: (v) => secondsToMinuteAndSeconds(Math.floor(v)),
    colorPercent: (v) => v / (10 * 60)
  });

  const morning: RouteChangeSummary = {
    name: "Average morning gap",
    before: findAverage(tripTable.filter((t) => t.oldGap && timeStringWithinRange(t.oldStart!, "05:00:00", "09:00:00"))
      .map((t) => t.oldGap!)),
    after: findAverage(tripTable.filter((t) => t.newGap && timeStringWithinRange(t.newStart!, "05:00:00", "09:00:00"))
      .map((t) => t.newGap!)),
    change: 0,
    display: (v) => secondsToMinuteAndSeconds(Math.floor(v)),
    colorPercent: (v) => v / (10 * 60)
  };
  if (!isNaN(morning.before) && !isNaN(morning.after)) {
    result.push(morning);
  }

  const afternoon: RouteChangeSummary = {
    name: "Average afternoon gap",
    before: findAverage(tripTable.filter((t) => t.oldGap && timeStringWithinRange(t.oldStart!, "15:00:00", "19:00:00"))
      .map((t) => t.oldGap!)),
    after: findAverage(tripTable.filter((t) => t.newGap && timeStringWithinRange(t.newStart!, "15:00:00", "19:00:00"))
      .map((t) => t.newGap!)),
    change: 0,
    display: (v) => secondsToMinuteAndSeconds(Math.floor(v)),
    colorPercent: (v) => v / (10 * 60)
  };
  if (!isNaN(afternoon.before) && !isNaN(afternoon.after)) {
    result.push(afternoon);
  }

  for (const data of result) {
    data.change = data.after - data.before;
  }

  return result;
}

function findAverage(array: number[]): number {
  return array.reduce((acc, v) => acc + v, 0) / array.length;
}

function getChangeColor(percentage: number) {
  if (percentage > 0) {
    return `color-mix(in hsl, red ${Math.min(100, percentage * 100)}%, #ffafaf)`;
  } else if (percentage === 0) {
    return `white`
  } else {
    return `color-mix(in hsl, #00ff00 ${Math.min(100, -percentage * 100)}%, #a4ffa4)`
  }
}

interface BlockDataRequest {
  routeId: string;
  serviceChange: ServiceChange
  direction: number;
};

async function getChangeData(params: BlockDataRequest): Promise<ChangeData | null> {
  const result = await Promise.all([fetch(`${busTrackerServerUrl}/api/routeDetails?${new URLSearchParams({
    routeId: params.routeId,
    date: dateStringToServiceDay(serviceChanges[params.serviceChange].before).toISOString()
  })}`), fetch(`${busTrackerServerUrl}/api/routeDetails?${new URLSearchParams({
    routeId: params.routeId + "-1", //todo: also handle when it loses the -
    date: dateStringToServiceDay(serviceChanges[params.serviceChange].after).toISOString()
  })}`)]);

  if (result[0].ok && result[1].ok) {
    const data = await result[0].json();
    const data2 = await result[1].json();

    return {
      before: data.filter((a: TripDetails) => a.routeDirection === params.direction),
      after: data2.filter((a: TripDetails) => a.routeDirection === params.direction),
    }
  }

  return null;
}

async function getRouteOptions(date: Date, excludeSchoolRoutes = false): Promise<ComboboxOptions> {
  const params: Record<string, string> = { date: date.toISOString() };
  if (excludeSchoolRoutes) params.excludeSchoolRoutes = "1";
  const result = await fetch(`${busTrackerServerUrl}/api/routes?${new URLSearchParams(params)}`, );

  if (result.ok) {
    const data = await result.json();
    if (Array.isArray(data)) {
      return data.sort(((a, b) => (parseInt(a.routeId) || Number.MAX_VALUE) - (parseInt(b.routeId) || Number.MAX_VALUE)))
      .map((b) => ({
        value: b.routeId,
        label: b.routeId
      }));
    }
  }

  return [];
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

  const [routes, setRoutes] = useState<ComboboxOptions>(searchParams.get("route") ? [{
    value: searchParams.get("route")!,
    label: searchParams.get("route")!
  }] : []);

  const [excludeSchool, setExcludeSchool] = useState<boolean>(
    searchParams.get("excludeSchoolRoutes") === "1" || searchParams.get("excludeSchoolRoutes") === "true"
  );

  useEffect(() => {
    getRouteOptions(date, excludeSchool).then(setRoutes);
  }, [date, excludeSchool]);

  const [currentRoute, setCurrentRoute] = useState<string | null>(searchParams.get("route"));
  useEffect(() => {
    const newRoute = searchParams.get("route");
    if (currentRoute !== newRoute) {
      setCurrentRoute(newRoute);
    }
  }, [currentRoute, searchParams]);

  const [serviceChange, setServiceChange] = useState<ServiceChange | null>(searchParams.get("serviceChange") as ServiceChange);
  useEffect(() => {
    const newServiceChange = searchParams.get("serviceChange");
    if (serviceChange !== newServiceChange) {
      setServiceChange(newServiceChange as ServiceChange);
    }
  }, [serviceChange, searchParams]);

  const [direction, setDirection] = useState<string | null>(searchParams.get("direction") ?? "0");
  useEffect(() => {
    const newDirection = searchParams.get("direction");
    if (direction !== newDirection) {
      setDirection(newDirection);
    }
  }, [direction, searchParams]);

  const [showTransseeLinks, setShowTransseeLinks] = useState(false);
  useEffect(() => {
    if (localStorage.getItem("showTransseeLinks")) {
      setShowTransseeLinks(true);
    }
  }, []);

  useEffect(() => {
    const val = searchParams.get("excludeSchoolRoutes");
    const flag = val === "1" || val === "true";
    if (flag !== excludeSchool) {
      setExcludeSchool(flag);
    }
  }, [searchParams, excludeSchool]);

  return (
    <>
      <div className="controls with-padding">
        <div className="control-boxes">
          <Combobox options={routes} 
            hintText="Select route..."
            value={currentRoute}
            onChange={(v) => {
              router.push(getPageUrl(pathname, searchParams, {
                route: v
              }));
            }}/>

            <Combobox options={serviceChangeOptions} 
              hintText="Select service change..."
              value={serviceChange}
              onChange={(v) => {
                router.push(getPageUrl(pathname, searchParams, {
                  serviceChange: v
                }));
              }}/>

            <Combobox options={directionOptions} 
              hintText="Select direction..."
              value={direction}
              onChange={(v) => {
                router.push(getPageUrl(pathname, searchParams, {
                  direction: v
                }));
              }}/>
        </div>

        <details className="advanced-options">
          <summary>Advanced</summary>

          <div>
            Show transsee links{" "}
            <input
              type="checkbox"
              checked={showTransseeLinks}
              onChange={() => {
                setShowTransseeLinks(!showTransseeLinks);
                if (!showTransseeLinks) {
                  localStorage.setItem("showTransseeLinks", "1");
                } else {
                  localStorage.removeItem("showTransseeLinks");
                }
              }}
            />
          </div>
          {/* <div>
            Exclude school trips{" "}
            <input
              type="checkbox"
              checked={excludeSchool}
              onChange={() => {
                const next = !excludeSchool;
                setExcludeSchool(next);
                router.push(getPageUrl(pathname, searchParams, {
                  excludeSchoolRoutes: next ? "1" : null
                }));
              }}
            />
          </div> */}
        </details>

        <details className="what-is-this">
          <summary>
            <HelpCircleIcon/>What is this?
          </summary>

          <p>
            This page tracks schedule changes for a route. See when what cuts or additions in service have been made.
          </p>

          <p>
            Red lines are trips removed from the schedule. Green lines are trips added to the schedule
          </p>

          <p>
            Orange gap times mean there is an increased service gap (decreased frequency). Light green gap times mean a decrease in service gap.
          </p>
        </details>

        <BadDataWarning date={date}/>
      </div>
      <RouteTables
        route={currentRoute}
        direction={Number(direction)}
        serviceChange={serviceChange}
        showTransseeLinks={showTransseeLinks}
      />
    </>
  );
}

interface GraphProps {
  route: string | null;
  direction: number;
  serviceChange: ServiceChange | null;
  showTransseeLinks: boolean;
}

function RouteTables({ route, direction, serviceChange, showTransseeLinks }: GraphProps) {
  const [tripTableData, setTripTableData] = useState<TripTableData[] | null>(null);
  const [changeSummary, setChangeSummary] = useState<RouteChangeSummary[] | null>(null);
  useEffect(() => {
    setTripTableData(null);

    if (route && serviceChange) {
      getChangeData({
        routeId: route,
        direction,
        serviceChange
      }).then((data) => {
        if (data) {
          const tripTableData = getTripTableData(data);
          setTripTableData(tripTableData);

          setChangeSummary(getChangeSummary(tripTableData));
        }
      });
    }
  }, [route, serviceChange, direction]);

  return (
    <div className="schedule-tables">
      {changeSummary &&
        <div className="block-node">
          <table>
            <thead>
              <tr>
                <th>
                  
                </th>
                <th>
                  Before
                </th>
                <th>
                  After
                </th>
                <th>
                  Change
                </th>
              </tr>
            </thead>
            <tbody>
              {changeSummary.map((b, i) => {
                return (
                  <tr key={i} className={`block-table nodrag nopan`}>
                    <td>
                      {b.name}
                    </td>
                    <td>
                      {b.display(b.before)}
                    </td>
                    <td>
                      {b.display(b.after)}
                    </td>
                    <td style={{
                      color: b.colorPercent ? getChangeColor(b.colorPercent(b.change)) : undefined
                    }}>
                      {b.display(b.change)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
      {tripTableData &&
        <div className="block-node">
          <table>
            <thead>
              <tr>
                {/* todo: only show block id if checkbox is checked, advanced option */}
                <th>
                  Headsign
                </th>
                <th>
                  Old start
                </th>
                <th>
                  New start
                </th>
                <th>
                  Old gap
                </th>
                <th>
                  New gap
                </th>
              </tr>
            </thead>
            <tbody>
              {tripTableData.map((b) => {
                return (
                  <tr key={String(b.oldTripId) + String(b.newTripId)} className={`block-table nodrag nopan`}
                      style={{
                        color: (b.oldTripId && !b.newTripId)
                          ? "red"
                          : ((!b.oldTripId && b.newTripId)
                              ? "#00ff00"
                            : undefined)
                      }}>
                    <td>
                      {b.headSign}
                    </td>
                    <td>
                      {showTransseeLinks && serviceChange && b.oldTripId ? (
                        <Link href={"https://transsee.ca/tripsched?" + new URLSearchParams({
                          a: "octranspo",
                          t: b.oldTripId,
                          date: serviceChanges[serviceChange].before
                        }).toString()}>
                          {b.oldStart}
                        </Link>
                      ) : (
                        b.oldStart
                      )}
                    </td>
                    <td>
                      {showTransseeLinks && serviceChange && b.newTripId ? (
                        <Link href={"https://transsee.ca/tripsched?" + new URLSearchParams({
                          a: "octranspo",
                          t: b.newTripId,
                          date: serviceChanges[serviceChange].after
                        }).toString()}>
                          {b.newStart}
                        </Link>
                      ) : (
                        b.newStart
                      )}
                    </td>
                    <td>
                      {b.oldGap ? secondsToMinuteAndSeconds(b.oldGap) : ""}
                    </td>
                    <td style={{
                        color: (b.oldGap && b.newGap && b.oldGap < b.newGap)
                          ? "orange"
                          : ((b.oldGap && b.newGap && b.oldGap > b.newGap)
                              ? "#a3f6a3"
                            : undefined)
                      }}>
                      {b.newGap ? secondsToMinuteAndSeconds(b.newGap) : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      }
    </div>
  );
}