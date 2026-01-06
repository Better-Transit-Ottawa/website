"use client";
import { AllBlocks, BlockData, busTrackerServerUrl, dateStringToServiceDay, getNextTrip, secondsToMinuteAndSeconds, timeStringDiff, timeStringToSeconds } from "@/utils/busTracker";
import { ReactFlow, Handle, Position, type Node, Edge, MarkerType, ReactFlowProvider, useEdgesState, useNodesState, ConnectionMode } from '@xyflow/react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import Combobox, { ComboboxOptions } from "@/components/ComboBox";
import { getPageUrl } from "@/utils/pageNavigation";
import { DatePicker } from "@/components/DatePicker";

const colors = [
  "#78B9B5",
  "#0f8c77ff",
  "#3d78a2ff",
  "#a38ec0ff",
  "#872341",
  "#BE3144",
  "#E17564"
]

interface BlockComponentProps {
  data: {
    blockId: string;
    block: BlockData[];
    colors: Record<string, string>;
  }
}

interface NodePosition {
  x: number,
  y: number
}

function BlockComponent(props: BlockComponentProps) {
  return (
    <>
      <div className="block-node">
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
            {props.data.block.map((b) => {
              const delay = b.actualStartTime ? timeStringDiff(b.actualStartTime, b.scheduledStartTime) : 0;

              return (
                <tr key={b.tripId}>
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
                    {b.routeId}
                  </td>
                  <td>
                    {b.headSign}
                  </td>
                  <td>
                    {b.scheduledStartTime}
                  </td>
                  <td className={((delay > 15 * 60) ? "red-text " : "") + ((delay > 5 * 60) ? "yellow-text" : "")}>
                    {b.actualStartTime}{b.actualStartTime && delay > 0 ? ` (${secondsToMinuteAndSeconds(delay)})` : ""}
                  </td>
                  <td>
                    {b.actualEndTime}
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
    blockOrder[block] = {
      x: 0,
      y: firstTierCursor
    };

    const existingBlockAtNextX = Object.values(blockOrder).filter((b) => b.x === 1).sort((a, b) => b.y - a.y)[0];
    const startY = existingBlockAtNextX ? existingBlockAtNextX.y + 1 : 0;
    generateNextNodePositionsInternal(blockOrder, blocks, edges, startTimes, block, 1, startY);

    firstTierCursor++;
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

function generateNodes(blocks: AllBlocks, edgeData: EdgeData, defaultBlockId: string): Node[] {
  const nodes: Node[] = [];

  const positions = generateNodePositions(blocks, edgeData.edges, defaultBlockId);

  for (const blockId in blocks) {
    const block = blocks[blockId];

    nodes.push({
      id: blockId,
      type: "block",
      position: {
        x: positions[blockId].x * 900,
        y: positions[blockId].y * 900
      },
      data: {
        blockId,
        block,
        colors: edgeData.colors
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
    const color = colors[colorIndex % colors.length];
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
            strokeWidth: 4,
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
      .map((b) => ({
        value: b.blockId,
        label: `${b.blockId} (${b.busCount} ${b.busCount === 1 ? "bus" : "buses"})`
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
      return data.map((b) => ({
        value: b,
        label: b
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

  return (
    <>
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
      <div className="flow-graph-container">
        <ReactFlowProvider>
          <Graph
            block={currentBlock}
            bus={currentVehicle}
            date={date}
          />
        </ReactFlowProvider>
      </div>
    </>
  );
}

interface GraphProps {
  block: string | null;
  bus: string | null;
  date: Date;
}

function Graph({ block, bus, date }: GraphProps) {
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
      setNodes(generateNodes(blockData, edgeData, block ? block : getNextTrip(blockData, bus!, null)?.blockId ?? ""));
      setEdges(edgeData.edges);
    }
  }, [blockData, block, bus, setNodes, setEdges, searchParams]);

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