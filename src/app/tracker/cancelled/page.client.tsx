"use client";
import { busTrackerServerUrl, dateStringToServiceDay, dateToDateString, getCurrentDate, isBadDataDate, timeStringDiff } from "@/utils/busTracker";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getPageUrl } from "@/utils/pageNavigation";
import { DatePicker } from "@/components/DatePicker";
import Link from "next/link";
import { HelpCircleIcon } from "lucide-react";
import Combobox from "@/components/ComboBox";

interface CancellationData {
  routeId: string;
  totalTrips: number;
  cancellations: Cancellation[];
}

interface Cancellation {
  tripId: string;
  blockId: string;
  headsign: string;
  direction: number;
  startTime: string;
  endTime: string;
  lastStartTime: string;
  nextStartTime: string;
}

interface RouteComponentProps {
  date: Date;
  routeId: string;
  totalTrips: number;
  cancellations: Cancellation[];
}

enum SortOptions {
  Route = "route",
  CancelNum = "cancelNum",
  CancelPercentage = "cancelPercentage"
}

const sortOptions = [{
  value: SortOptions.Route,
  label: "Sort by route"
}, {
  value: SortOptions.CancelNum,
  label: "Sort by cancellations"
}, {
  value: SortOptions.CancelPercentage,
  label: "Sort by cancellation percentage"
}];

function RouteComponent(props: RouteComponentProps) {
  return (
    <>
      <div className="block-node" style={{
        height: "fit-content"
      }}>
        <Link href={"/tracker/route?" + new URLSearchParams({
          date: dateToDateString(props.date),
          route: props.routeId
        }).toString()}>
          <div className="block-node-title">
            Route: <strong>{props.routeId}</strong>
          </div>
        </Link>

        <div className="block-node-description">
          Total trips: <strong>{props.totalTrips}</strong>{" | "}
          Cancelled: <strong>{props.cancellations.length}</strong> (<strong>{Math.floor(props.cancellations.length / props.totalTrips * 100)}%</strong>)
        </div>

        <table>
          <thead>
            <tr>
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
                End
              </th>
              <th>
                Service Gap
              </th>
            </tr>
          </thead>
          <tbody>
            {props.cancellations.map((b) => {
              const serviceGap = b.nextStartTime &&  b.lastStartTime ? Math.abs(Math.floor(timeStringDiff(b.nextStartTime, b.lastStartTime) / 60)) : 0;
              return (
                <tr key={b.tripId} className={`block-table nodrag nopan`}>
                  <td>
                    <Link href={"/tracker/blocks?" + new URLSearchParams({
                      date: dateToDateString(props.date),
                      block: b.blockId!
                    }).toString()}>
                      {b.blockId}
                    </Link>
                  </td>
                  <td>
                    {b.headsign}
                  </td>
                  <td>
                    {b.startTime}
                  </td>
                  <td>
                    {b.endTime}
                  </td>
                  <td className={`${((serviceGap > 45) ? "red-text " : "")}${((serviceGap > 30) ? "yellow-text" : "")}`}>
                    {serviceGap ? `${serviceGap} min` : ""}
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

interface CancellationDataRequest {
  date: string;
};

async function getCancellationData(params: CancellationDataRequest): Promise<CancellationData[] | null> {
  const request = await fetch(`${busTrackerServerUrl}/api/canceled?${new URLSearchParams(params as unknown as Record<string, string>)}`, );
  if (request.ok) {
    const data = await request.json();
    return data;
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

  const [sort, setSort] = useState(searchParams.get("sort") as SortOptions ?? SortOptions.Route);
  useEffect(() => {
    const newSort = searchParams.get("sort") || SortOptions.Route;
    if (newSort !== sort) {
      setSort(newSort as SortOptions);
    }
  }, [searchParams, sort]);

  return (
    <>
      <div className="controls with-padding">
        <div className="control-boxes control-box-no-width">
          <Combobox options={sortOptions} 
            hintText="Select sort..."
            value={sort}
            onChange={(v) => {
              router.push(getPageUrl(pathname, searchParams, {
                sort: v === SortOptions.Route ? null : v
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
            This page shows you lists of cancellations on each route for a particular day. The service gap column shows you the gap in bus service created by this missing trip.
          </p>

          <p>
            A “block” generally is the path one bus will take throughout the day. Clicking the “Block ID” will bring you to the block explorer where you can see what caused the cancellation to occur. Cancellations generally occur when there was never a bus planned to be available for the block, a priority trip on another block needs a bus to cover it, or if the previous trip went so late that the next trip on the block must be cancelled.
          </p>
        </details>

        {isBadDataDate(date, true) && 
          <div>
            Warning: Data on this day is incomplete due to service outages or another reason
          </div>
        }
      </div>
      <CancelTables
        date={date}
        sort={sort}
      />
    </>
  );
}

interface GraphProps {
  date: Date;
  sort: SortOptions;
}

function sortData(data: CancellationData[], sort: SortOptions) {
  switch (sort) {
    case SortOptions.Route:
      data.sort((a, b) => parseInt(a.routeId) - parseInt(b.routeId));
      break;
    case SortOptions.CancelNum:
      data.sort((a, b) => b.cancellations.length - a.cancellations.length);
      break;
    case SortOptions.CancelPercentage:
      data.sort((a, b) => (b.cancellations.length / b.totalTrips) - (a.cancellations.length / a.totalTrips));
      break;
  }

  return data;
}

function CancelTables({ date, sort }: GraphProps) {
  const [cancelDataUnSorted, setCancelDataUnSorted] = useState<CancellationData[] | null>(null);
  const [cancelData, setCancelData] = useState<CancellationData[] | null>(null);
  useEffect(() => {
    setCancelDataUnSorted(null);

    getCancellationData({
      date: date.toISOString()
    }).then(setCancelDataUnSorted);
  }, [date]);
  useEffect(() => {
    if (cancelDataUnSorted) {
      setCancelData(sortData([...cancelDataUnSorted], sort));
    } else {
      setCancelData(null);
    }
  }, [cancelDataUnSorted, sort]);

  return (
    <div className="route-tables cancel-tables">
      {cancelData && 
        cancelData.map((c) => (
          <RouteComponent
            key={c.routeId}
            date={date}
            routeId={c.routeId}
            totalTrips={c.totalTrips}
            cancellations={c.cancellations}
          />
        ))
      }
    </div>
  );
}