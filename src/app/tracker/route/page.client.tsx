"use client";
import { busColors, busTrackerServerUrl, dateStringToServiceDay, secondsToMinuteAndSeconds, timeStringDiff, TripDetails } from "@/utils/busTracker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Combobox, { ComboboxOptions } from "@/components/ComboBox";
import { getPageUrl } from "@/utils/pageNavigation";
import { DatePicker } from "@/components/DatePicker";
import Link from "next/link";

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
                Scheduled start
              </th>
              <th>
                Actual start
              </th>
              <th>
                End
              </th>
              <th>
                Bus ID
              </th>
            </tr>
          </thead>
          <tbody>
            {props.trips.map((t) => {
              const delay = t.actualStartTime ? timeStringDiff(t.actualStartTime, t.scheduledStartTime) : 0;
              const canceled = t.canceled && !t.actualStartTime;

              return (
                <tr key={t.tripId} className={`block-table nodrag nopan ${canceled ? "cancelled" : ""}`}>
                  <td>
                    {t.tripId}
                  </td>
                  <td>
                    <Link href={"/tracker/blocks?" + new URLSearchParams({
                      date: props.date.toLocaleDateString(),
                      block: t.blockId!
                    }).toString()}>
                      {t.blockId}
                    </Link>
                  </td>
                  <td>
                    {t.headSign}
                  </td>
                  <td>
                    {t.scheduledStartTime}
                  </td>
                  <td className={`${((delay > 15 * 60 || canceled) ? "red-text " : "")}${((delay > 5 * 60) ? "yellow-text" : "")}`}>
                    {canceled
                      ? "CANCELLED"
                      : `${t.actualStartTime ?? ""}${t.actualStartTime && delay > 0 ? ` (${secondsToMinuteAndSeconds(delay)})` : ""}`}
                  </td>
                  <td>
                    {t.actualEndTime}
                  </td>
                  <td style={{ color: t.busId ? props.colors[t.busId] : undefined }}>
                    <Link href={"/tracker/blocks?" + new URLSearchParams({
                      date: props.date.toLocaleDateString(),
                      bus: t.busId!
                    }).toString()}>
                      {t.busId}
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

  const [date, setDate] = useState<Date>(dateStringToServiceDay((searchParams.get("date") ? searchParams.get("date")! : new Date().toLocaleDateString())));
  useEffect(() => {
    const newDate = searchParams.get("date") || new Date().toLocaleDateString();
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
              const dateString = d.toLocaleDateString();
              if (dateString !== new Date().toLocaleDateString()) {
                router.push(getPageUrl(pathname, searchParams, {
                  date: d.toLocaleDateString()
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