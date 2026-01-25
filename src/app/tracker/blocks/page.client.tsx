"use client";
import { AllBlocks, BlockData, busColors, busTrackerServerUrl, dateStringToServiceDay, dateToDateString, getCurrentDate, getNextTrip, secondsToMinuteAndSeconds, timeStringDiff, timeStringToSeconds } from "@/utils/busTracker";
import { ReactFlow, Handle, Position, type Node, Edge, MarkerType, ReactFlowProvider, useEdgesState, useNodesState, ConnectionMode } from '@xyflow/react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Combobox, { ComboboxOptions } from "@/components/ComboBox";
import { debounce, getPageUrl } from "@/utils/pageNavigation";
import { DatePicker } from "@/components/DatePicker";
import Link from "next/link";
import DownloadButton from "./download-button";
import { Slider } from "@/components/ui/slider";
import { HelpCircleIcon } from "lucide-react";

interface BlockComponentProps {
  data: {
    date: Date;
    blockId: string;
    block: BlockData[];
    colors: Record<string, string>;
    border: string | null;
  }
}

interface NodePosition {
  x: number,
  y: number
}

function BlockComponent(props: BlockComponentProps) {
  return (
    <>
      <div className="block-node"
          style={{
            borderColor: props.data.border ?? undefined,
            borderWidth: props.data.border ? "5px" : undefined
          }}>
        <div className="block-node-title">
          Block: <strong>{props.data.blockId}</strong>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>
                Trip ID
              </th>
              <th>
                Route ID
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
            {props.data.block.map((b, index) => {
              const delayStart = b.actualStartTime ? timeStringDiff(b.actualStartTime, b.scheduledStartTime) : 0;
              const delayEnd = b.actualEndTime ? timeStringDiff(b.actualEndTime, b.scheduledEndTime) : (b.delay ?? 0) * 60;
              const canceled = b.canceled && !b.actualStartTime;
              const untracked = !b.canceled
                && !b.actualStartTime
                && ((props.data.block.some((b, i) => i > index && b.actualStartTime)) 
                  || props.data.date.toLocaleDateString() != new Date().toLocaleDateString()
                  || timeStringDiff(new Date().toLocaleTimeString(), b.scheduledEndTime) > 60 * 60);

              return (
                <tr key={b.tripId} className={`block-table nodrag nopan ${canceled ? "cancelled" : ""} ${untracked ? "untracked" : ""}`}>
                  <td className="handle-container">
                    <Handle
                      type="target"
                      position={Position.Left}
                      isConnectable={true}
                      id={b.tripId + "L"}
                      style={{
                        visibility: "hidden"
                      }}
                    />
                    {b.tripId}
                  </td>
                  <td>
                    <Link href={"/tracker/route?" + new URLSearchParams({
                      date: dateToDateString(props.data.date),
                      route: b.routeId!
                    }).toString()}>
                      {b.routeId}
                    </Link>
                  </td>
                  <td>
                    {b.headSign}
                  </td>
                  <td>
                    {b.scheduledStartTime}
                  </td>
                  <td className={`${((delayStart > 15 * 60) ? "red-text " : "")}${((delayStart > 5 * 60) ? "yellow-text" : "")}`}>
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
                  <td className="handle-container"
                      style={{ color: b.busId ? props.data.colors[b.busId] : undefined }}>
                    {b.busId}

                    <Handle
                      type="source"
                      position={Position.Right}
                      isConnectable={true}
                      id={b.tripId + "R"}
                      style={{
                        visibility: "hidden"
                      }}
                    />
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

type BlockDataRequest = {
  date: string;
} & ({
  blockId: string
} | {
  busId: string
});

async function getBlockData(params: BlockDataRequest): Promise<AllBlocks> {
  const result = await fetch(`${busTrackerServerUrl}/api/blockDetails?${new URLSearchParams(params)}`, );
  if (result.ok) {
    return await result.json();
  }

  return {};
}

function generateNodePositions(blocks: AllBlocks, edges: Edge[], defaultBlockId: string): Record<string, NodePosition> {
  // Determine an approximate order
  const blockOrder = {} as Record<string, NodePosition>;

  // Find start times for each trip
  const startTimes = {} as Record<string, number>;
  for (const blockId in blocks) {
    for (const trip of blocks[blockId]) {
      startTimes[trip.tripId] = timeStringToSeconds(trip.scheduledStartTime);
    }
  }

  // First look for items that are never targeted
  let firstBlocks = Object.keys(blocks)
    .filter((k) => !edges.some((e) => e.target === k && e.source !== k))
    .sort((a, b) => getStartTimeInSecondsForTarget(edges, startTimes, a) - getStartTimeInSecondsForTarget(edges, startTimes, b));

  if (firstBlocks.length === 0) {
    // Start at the initial fetched block id

    firstBlocks = [defaultBlockId];
  }

  let firstTierCursor = 0;
  for (const block of firstBlocks) {
    if (!(block in blockOrder)) {
      blockOrder[block] = {
        x: 0,
        y: firstTierCursor
      };

      const existingBlockAtNextX = Object.values(blockOrder).filter((b) => b.x === 1).sort((a, b) => b.y - a.y)[0];
      const startY = existingBlockAtNextX ? existingBlockAtNextX.y + 1 : 0;
      generateNextNodePositionsInternal(blockOrder, blocks, edges, startTimes, block, 1, startY);

      firstTierCursor++;
    }
  }

  // Make sure all blocks have made it in the blockOrder
  while (Object.keys(blocks).some((b) => !(b in blockOrder))) {
    const nextBlocks = Object.keys(blocks)
      .filter((b) => !(b in blockOrder))
      .sort((a, b) => getStartTimeInSecondsForTarget(edges, startTimes, a) - getStartTimeInSecondsForTarget(edges, startTimes, b));
    
    for (const block of nextBlocks) {
      if (!(block in blockOrder)) {
        blockOrder[block] = {
          x: 0,
          y: firstTierCursor
        };
  
        const existingBlockAtNextX = Object.values(blockOrder).filter((b) => b.x === 1).sort((a, b) => b.y - a.y)[0];
        const startY = existingBlockAtNextX ? existingBlockAtNextX.y + 1 : 0;
        generateNextNodePositionsInternal(blockOrder, blocks, edges, startTimes, block, 1, startY);
  
        firstTierCursor++;
      }
    }
  }

  return blockOrder;
}

function getStartTimeInSecondsForTarget(edges: Edge[], startTimes: Record<string, number>, target: string): number {
  const targetedEdges = edges.filter((e) => e.source === target && e.target !== target && e.targetHandle)
    .sort((a, b) => startTimes[a.targetHandle!.slice(0, -1)] - startTimes[b.targetHandle!.slice(0, -1)]);
  
  return targetedEdges[0] ? startTimes[targetedEdges[0].targetHandle!.slice(0, -1)] : 0;
}

function generateNextNodePositionsInternal(blockOrder: Record<string, NodePosition>, blocks: AllBlocks, edges: Edge[], startTimes: Record<string, number>, currentBlock: string, x: number, startY: number) {
    const nextNodes = Object.keys(blocks)
      .filter((k) => edges.some((e) => e.target === k && e.source === currentBlock))
      .sort((a, b) => getStartTimeInSecondsForTarget(edges, startTimes, a) - getStartTimeInSecondsForTarget(edges, startTimes, b));

    let heightCursor = startY;
    for (const node of nextNodes) {
      if (!(node in blockOrder)) {
        blockOrder[node] = {
          x,
          y: heightCursor
        };

        const existingBlockAtNextX = Object.values(blockOrder).filter((b) => b.x === x + 1).sort((a, b) => b.y - a.y)[0];
        const startY = existingBlockAtNextX ? existingBlockAtNextX.y + 1 : 0;
        generateNextNodePositionsInternal(blockOrder, blocks, edges, startTimes, node, x + 1, startY);
        heightCursor++;
      }
    }
}

function generateNodes(date: Date, blocks: AllBlocks,
    onlyShowDirectlyReleventBuses: boolean,
    edgeData: EdgeData, defaultBlockId: string, busIdSearched: string | null): Node[] {
  const nodes: Node[] = [];

  const initialBlockBuses = new Set();
  if (blocks[defaultBlockId]) {
    for (const item of blocks[defaultBlockId]) {
      if (item.busId) initialBlockBuses.add(item.busId);
    }
  }
  const newBlocks = {} as AllBlocks;
  for (const blockId in blocks) {
    const block = blocks[blockId];

    if (onlyShowDirectlyReleventBuses 
        && blockId !== defaultBlockId
        && !block.some((b) => initialBlockBuses.has(b.busId))) {
      continue;
    }

    newBlocks[blockId] = block;
  }
  blocks = newBlocks;

  const positions = generateNodePositions(blocks, edgeData.edges, defaultBlockId);

  for (const blockId in blocks) {
    const block = blocks[blockId];

    nodes.push({
      id: blockId,
      type: "block",
      position: {
        x: positions[blockId].x * 1100,
        y: positions[blockId].y * 900
      },
      data: {
        date,
        blockId,
        block,
        colors: edgeData.colors,
        border: blockId === defaultBlockId
          ? (busIdSearched ? edgeData.colors[busIdSearched] : busColors[0])
          : null
      },
    });
  }

  return nodes;
}

interface EdgeData {
  edges: Edge[];
  colors: Record<string, string>;
}

function generateEdges(blocks: AllBlocks): EdgeData {
  const edges: Edge[] = [];
  const colorPerBus: Record<string, string> = {};

  const buses = new Set<string>();
  for (const blockId in blocks) {
    for (const data of blocks[blockId]) {
      if (data.busId) {
        buses.add(data.busId);
      }
    }
  }

  let colorIndex = 0;
  for (const bus of buses) {
    let firstTrip = getNextTrip(blocks, bus, null);
    if (!firstTrip) continue;
    let nextTrip = getNextTrip(blocks, bus, firstTrip.scheduledStartTime);
    const color = busColors[colorIndex % busColors.length];
    colorPerBus[bus] = color;

    while (firstTrip && nextTrip) {
      if (firstTrip.tripId !== nextTrip.lastTripId) {
        edges.push({
          id: `${firstTrip.tripId}->${nextTrip.tripId}`,
          sourceHandle: firstTrip.tripId + "R",
          // Connect back to itself if it is the same block
          targetHandle: firstTrip.blockId !== nextTrip.blockId ? (nextTrip.tripId + "L") : (nextTrip.tripId + "R"),
          source: firstTrip.blockId,
          target: nextTrip.blockId,
          label: firstTrip.blockId !== nextTrip.blockId ? firstTrip.busId : "",
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 10,
            height: 10,
            color
          },
          style: {
            stroke: color
          },
          labelStyle: {
            fontSize: "26px"
          },
          type: firstTrip.blockId === nextTrip.blockId ? "smoothstep" : "default"
        });
      }

      firstTrip = nextTrip;
      nextTrip = getNextTrip(blocks, bus, firstTrip.scheduledStartTime);
    }

    colorIndex++;
  }

  return {
    edges,
    colors: colorPerBus
  };
}

async function getBlockOptions(date: Date): Promise<ComboboxOptions> {
  const result = await fetch(`${busTrackerServerUrl}/api/blocks?${new URLSearchParams({
    date: date.toISOString()
  })}`, );

  if (result.ok) {
    const data = await result.json();
    if (Array.isArray(data)) {
      return data.filter((a) => !!a.blockId).sort(((a, b) => parseInt(a.blockId.split("-")[0]) - parseInt(b.blockId.split("-")[0])))
      .sort((a, b) => parseInt(a.blockId.split("-")[1]) - parseInt(b.blockId.split("-")[1]))
      .sort((a, b) => parseInt(a.blockId.split("-")[0]) - parseInt(b.blockId.split("-")[0]))
      .map((b) => ({
        value: b.blockId,
        label: `${b.blockId} (${(parseInt(b.blockId) > 10000000) ? `train` : `${b.busCount} ${b.busCount === 1 ? "bus" : "buses"}`})`
      }));
    }
  }

  return [];
}

async function getVehicleOptions(date: Date): Promise<ComboboxOptions> {
  const result = await fetch(`${busTrackerServerUrl}/api/vehicles?${new URLSearchParams({
    date: date.toISOString()
  })}`, );

  if (result.ok) {
    const data = await result.json();
    if (Array.isArray(data)) {
      return data.sort((a, b) => parseInt(a) - parseInt(b)).map((b) => ({
        value: b.busId,
        label: `${b.busId} (${b.blockCount} ${b.blockCount === 1 ? "block" : "blocks"})`
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

  const [blocks, setBlocks] = useState<ComboboxOptions>(searchParams.get("block") ? [{
    value: searchParams.get("block")!,
    label: searchParams.get("block")!
  }] : []);
  useEffect(() => {
    getBlockOptions(date).then(setBlocks)
  }, [date]);
  const [vehicles, setVehicles] = useState<ComboboxOptions>(searchParams.get("bus") ? [{
    value: searchParams.get("bus")!,
    label: searchParams.get("bus")!
  }] : []);
  useEffect(() => {
    getVehicleOptions(date).then(setVehicles)
  }, [date]);

  const [currentBlock, setCurrentBlock] = useState<string | null>(searchParams.get("block"));
  useEffect(() => {
    const newBlock = searchParams.get("block");
    if (currentBlock !== newBlock) {
      setCurrentBlock(newBlock);
    }
  }, [currentBlock, searchParams]);

  const [currentVehicle, setCurrentVehicle] = useState<string | null>(searchParams.get("bus"));
  useEffect(() => {
    const bus = searchParams.get("bus");
    if (currentVehicle !== bus) {
      setCurrentVehicle(bus);
      if (bus) {
        setCurrentBlock(null);
      }
    }
  }, [currentVehicle, searchParams]);

  const [arrowSize, setArrowSize] = useState<number>(4);
  const [onlyShowDirectlyReleventBuses, setOnlyShowDirectlyReleventBuses] = useState(true);

  return (
    <ReactFlowProvider>
      <div className="controls">
        <div className="control-boxes">
          <Combobox options={blocks} 
            hintText="Select block..."
            value={currentBlock}
            onChange={(v) => {
              router.push(getPageUrl(pathname, searchParams, {
                block: v,
                bus: null
              }));
            }}/>
          <Combobox options={vehicles} 
            hintText="Select bus..."
            value={currentVehicle}
            onChange={(v) => {
              router.push(getPageUrl(pathname, searchParams, {
                block: null,
                bus: v
              }));
            }}/>
        </div>

        <details className="advanced-options">
          <summary>Advanced</summary>

          <div>
            Arrow size
            <Slider
              defaultValue={[arrowSize]}
              onValueChange={debounce((v) => {
                setArrowSize(v[0]);
              }, 100)}
              max={100}
              min={1}
              step={1}
              className="slider"
            />
          </div>

          <div>
            Only show directly relevant buses{" "}
            <input
              type="checkbox"
              checked={onlyShowDirectlyReleventBuses}
              onChange={() => {
                setOnlyShowDirectlyReleventBuses(!onlyShowDirectlyReleventBuses);
              }}
            />
          </div>

          <DownloadButton name={currentBlock ? currentBlock : currentVehicle ?? ""} />
        </details>

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
            OC Transpo is facing a significant bus shortage. Because of this, many trips never get a bus assigned, and buses have to be re-assigned throughout the day. This tracks the path of a bus in a map format.
          </p>

          <p>
            A “block” generally is the path one bus will take throughout the day. When a bus switches a block, the diagram will show an arrow from one trip to the bus’s next trip.
            Buses generally switch blocks when a priority trip on another block needs a bus to cover, or if the previous trip went so late that the next trip on the block must be cancelled.
          </p>

          <p>
            The table shows the “scheduled start” and “actual start” of routes to show the delay of buses. In brackets in the “actual start” and “actual end” column, it shows the delay in minutes.
          </p>
        </details>
      </div>
      <div className="flow-graph-container" style={{
        "--flow-stroke-width": arrowSize
      } as React.CSSProperties}>
        <Graph
          block={currentBlock}
          bus={currentVehicle}
          onlyShowDirectlyReleventBuses={onlyShowDirectlyReleventBuses}
          date={date}
        />
      </div>
    </ReactFlowProvider>
  );
}

interface GraphProps {
  block: string | null;
  bus: string | null;
  onlyShowDirectlyReleventBuses: boolean;
  date: Date;
}

function Graph({ block, bus, onlyShowDirectlyReleventBuses, date }: GraphProps) {
  const [blockData, setBlockData] = useState<AllBlocks>({});
  const searchParams = useSearchParams();
  useEffect(() => {
    setBlockData({});

    if (bus) {
      getBlockData({
        busId: bus,
        date: date.toISOString()
      }).then(setBlockData);
    } else if (block) {
      getBlockData({
        blockId: block,
        date: date.toISOString()
      }).then(setBlockData);
    }
  }, [block, bus, date]);


  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  useEffect(() => {
    const edgeData = generateEdges(blockData);

    if (block || bus) {
      setNodes(generateNodes(date, blockData, onlyShowDirectlyReleventBuses, edgeData, block ? block : getNextTrip(blockData, bus!, null)?.blockId ?? "", bus));
      setEdges(edgeData.edges);
    }
  }, [date, blockData, block, bus, onlyShowDirectlyReleventBuses, setNodes, setEdges, searchParams]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      fitView={true}
      connectionMode={ConnectionMode.Loose}
      nodeTypes={{
        block: BlockComponent
      }}
      minZoom={0.01}
      colorMode="dark"
    />
  );
}