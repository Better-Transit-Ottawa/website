"use client";
import { busColors, busTrackerServerUrl, dateStringToServiceDay, dateToDateString, getCurrentDate, isBadDataDate, secondsToMinuteAndSeconds, timeStringDiff, TripDetails } from "@/utils/busTracker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Combobox, { ComboboxOptions } from "@/components/ComboBox";
import { getPageUrl } from "@/utils/pageNavigation";
import { DatePicker } from "@/components/DatePicker";
import Link from "next/link";
import { HelpCircleIcon } from "lucide-react";

interface RouteData {
  trip1: TripDetails[];
  trip2: TripDetails[];
  colorPerBus: Record<string, string>;
}

interface RouteComponentProps {
  date: Date;
  routeId: string;
  trips: TripDetails[];
  colors: Record<string, string>;
}

function RouteComponent(props: RouteComponentProps) {
  return (
    <>
      <div className="block-node">
        <table>
          <thead>
            <tr>
              <th>
                Trip ID
              </th>
              <th>
                Block ID
              </th>
              <th>
                Headsign
              </th>
              <th>
                Start
              </th>
              <th>
                Actual start
              </th>
              <th>
                End
              </th>
              <th>
                Actual end
              </th>
              <th>
                Bus ID
              </th>
            </tr>
          </thead>
          <tbody>
            {props.trips.map((b, index) => {
              const delayStart = b.actualStartTime ? timeStringDiff(b.actualStartTime, b.scheduledStartTime) : 0;
              const delayEnd = b.actualEndTime ? timeStringDiff(b.actualEndTime, b.scheduledEndTime) : (b.delay ?? 0) * 60;
              const canceled = b.canceled && !b.actualStartTime;
              const untracked = !b.canceled
                && !b.actualStartTime
                && ((props.trips.some((b, i) => i > index && b.actualStartTime)) 
                  || props.date.toLocaleDateString() != new Date().toLocaleDateString()
                  || timeStringDiff(new Date().toLocaleTimeString(), b.scheduledEndTime) > 60 * 60);

              return (
                <tr key={b.tripId} className={`block-table nodrag nopan ${canceled ? "cancelled" : ""} ${untracked ? "untracked" : ""}`}>
                  <td>
                    {b.tripId}
                  </td>
                  <td>
                    <Link href={"/tracker/blocks?" + new URLSearchParams({
                      date: dateToDateString(props.date),
                      block: b.blockId!
                    }).toString()}>
                      {b.blockId}
                    </Link>
                  </td>
                  <td>
                    {b.headSign}
                  </td>
                  <td>
                    {b.scheduledStartTime}
                  </td>
                  <td className={`actual-time ${((delayStart > 15 * 60) ? "red-text " : "")}${((delayStart > 5 * 60) ? "yellow-text" : "")}`}>
                    {untracked 
                      ? "UNTRACKED"
                      : (canceled
                        ? "CANCELLED"
                        : `${b.actualStartTime ?? ""}${b.actualStartTime && delayStart > 0 ? ` (${secondsToMinuteAndSeconds(delayStart)})` : ""}`)}
                  </td>
                  <td>
                    {b.scheduledEndTime}
                  </td>
                  <td className={`${((delayEnd > 15 * 60) ? "red-text " : "")}${((delayEnd > 5 * 60) ? "yellow-text" : "")}`}>
                    {`${b.actualEndTime ?? (b.delay ? "Active" : "")}${(delayEnd ? ` (${secondsToMinuteAndSeconds(Math.floor(delayEnd))})` : "")}`}
                  </td>
                  <td style={{ color: b.busId ? props.colors[b.busId] : undefined }}>
                    <Link href={"/tracker/blocks?" + new URLSearchParams({
                      date: dateToDateString(props.date),
                      bus: b.busId!
                    }).toString()}>
                      {b.busId}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

interface BlockDataRequest {
  routeId: string;
  date: string;
};

async function getRouteData(params: BlockDataRequest): Promise<RouteData | null> {
  const result = await fetch(`${busTrackerServerUrl}/api/routeDetails?${new URLSearchParams(params as unknown as Record<string, string>)}`, );
  if (result.ok) {
    const data = await result.json();

    // Find colors for buses
    const colorPerBus: Record<string, string> = {};
    let index = 0;
    for (const trip of data) {
      if (trip.busId && !colorPerBus[trip.busId]) {
        colorPerBus[trip.busId] = busColors[index % busColors.length];
        index++;
      }
    }

    return {
      trip1: data.filter((a: TripDetails) => a.routeDirection === 0),
      trip2: data.filter((a: TripDetails) => a.routeDirection !== 0),
      colorPerBus
    }
  }

  return null;
}

async function getRouteOptions(date: Date): Promise<ComboboxOptions> {
  const result = await fetch(`${busTrackerServerUrl}/api/routes?${new URLSearchParams({
    date: date.toISOString()
  })}`, );

  if (result.ok) {
    const data = await result.json();
    if (Array.isArray(data)) {
      return data.sort(((a, b) => parseInt(a.routeId) - parseInt(b.routeId)))
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
  useEffect(() => {
    getRouteOptions(date).then(setRoutes);
  }, [date]);

  const [currentRoute, setCurrentRoute] = useState<string | null>(searchParams.get("route"));
  useEffect(() => {
    const newRoute = searchParams.get("route");
    if (currentRoute !== newRoute) {
      setCurrentRoute(newRoute);
    }
  }, [currentRoute, searchParams]);

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
        </div>

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
            This page tracks a route throughout the day. When a trip has been cancelled, it will appear red. Cancellations usually occur due to a bus never being available to run the route, the bus that was supposed to run the route running late, or the bus was taken to run a higher priority route.
          </p>

          <p>
            The table shows the “scheduled start” and “actual start” of routes to show the delay of buses. In brackets in the “actual start” and “actual end” column, it shows the delay in minutes.
          </p>

          <p>
            A “block” generally is the path one bus will take throughout the day. Clicking on the “Block ID” will bring you to a diagram showing you how buses on that block have been running throughout the day. This can allow you to see why a cancellation might have occurred.
          </p>
        </details>

        {isBadDataDate(date) && 
          <div>
            Warning: Data on this day is incomplete due to service outages or another reason
          </div>
        }
      </div>
      <RouteTables
        route={currentRoute}
        date={date}
      />
    </>
  );
}

interface GraphProps {
  route: string | null;
  date: Date;
}

function RouteTables({ route, date }: GraphProps) {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  useEffect(() => {
    setRouteData(null);

    if (route) {
      getRouteData({
        routeId: route,
        date: date.toISOString()
      }).then(setRouteData);
    }
  }, [route, date]);

  return (
    <div className="route-tables">
      {routeData && 
        <>
          <RouteComponent
            date={date}
            routeId={route!}
            trips={routeData.trip1}
            colors={routeData.colorPerBus}
          />
          <RouteComponent
            date={date}
            routeId={route!}
            trips={routeData.trip2}
            colors={routeData.colorPerBus}
          />
        </>
      }
    </div>
  );
}