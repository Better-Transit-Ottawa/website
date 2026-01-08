export interface BlockData {
    tripId: string,
    routeId: string,
    headSign: string,
    routeDirection: number,
    scheduledStartTime: string,
    scheduledEndTime: string;
    actualStartTime: string | null,
    actualEndTime: string | null,
    delay: number | null;
    canceled: number | null;
    busId: string | null
}

export interface BlockDataExtra extends BlockData {
    blockId: string;
    lastTripId: string | null;
}

export type AllBlocks = Record<string, BlockData[]>;

export interface TripDetails {
    tripId: string;
    headSign: string;
    routeDirection: number;
    scheduledStartTime: string;
    scheduledEndTime: string;
    actualStartTime: string | null;
    actualEndTime: string | null;
    delay: number | null;
    canceled: number | null;
    busId: string | null;
    blockId: string | null;
}

export const busTrackerServerUrl = process.env.NEXT_PUBLIC_BUS_TRACKER_URL ?? "https://bus.ajay.app";

export const busColors = [
  "#0f8c77ff",
  "#78B9B5",
  "#3d78a2ff",
  "#a38ec0ff",
  "#872341",
  "#BE3144",
  "#E17564"
];

export function getNextTrip(blocks: AllBlocks, busId: string, lastTripTime: string | null): BlockDataExtra | null {
    let bestOption: BlockDataExtra | null = null;

    for (const blockId in blocks) {
        let lastTripId = null;
        for (const block of blocks[blockId]) {
            if (block.busId === busId && (lastTripTime === null || isTimeStringOlder(lastTripTime, block.scheduledStartTime))
                    && (bestOption === null || isTimeStringOlder(block.scheduledStartTime, bestOption.scheduledStartTime))) {
                bestOption = {
                    ...block,
                    blockId,
                    lastTripId
                };
            }

            lastTripId = block.tripId;
        }
    }

    return bestOption;
}

function isTimeStringOlder(timeString1: string, timeString2: string): boolean {
    const hourPart1 = parseInt(timeString1.substring(0, 2));
    const minutePart1 = parseInt(timeString1.substring(3, 5));
    const secondPart1 = parseInt(timeString1.substring(6, 8));

    const hourPart2 = parseInt(timeString2.substring(0, 2));
    const minutePart2 = parseInt(timeString2.substring(3, 5));
    const secondPart2 = parseInt(timeString2.substring(6, 8));

    return hourPart1 < hourPart2
        || (hourPart1 === hourPart2 && (minutePart1 < minutePart2
                                            || (minutePart1 === minutePart2 && secondPart1 < secondPart2)));
}

export function timeStringDiff(timeString1: string, timeString2: string): number {
    const hourPart1 = parseInt(timeString1.substring(0, 2));
    const minutePart1 = parseInt(timeString1.substring(3, 5));
    const secondPart1 = parseInt(timeString1.substring(6, 8));

    const hourPart2 = parseInt(timeString2.substring(0, 2));
    const minutePart2 = parseInt(timeString2.substring(3, 5));
    const secondPart2 = parseInt(timeString2.substring(6, 8));

    return (hourPart1 - hourPart2) * 60 * 60 + (minutePart1 - minutePart2) * 60 + (secondPart1 - secondPart2);
}

export function timeStringToSeconds(timeString: string): number {
    const hourPart = parseInt(timeString.substring(0, 2));
    const minutePart = parseInt(timeString.substring(3, 5));
    const secondPart = parseInt(timeString.substring(6, 8));

    return hourPart * 60 * 60 + minutePart * 60 + secondPart;
}

export function dateToTimeString(date: Date, moreThan24HourTime = true): string {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    if (moreThan24HourTime && hours < 3) {
        hours += 24;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function secondsToMinuteAndSeconds(seconds: number): string {
    return `${Math.floor(seconds / 60)}:${Math.abs((seconds % 60)).toString().padStart(2, '0')}`;
}

export function dateStringToServiceDay(dateString: string): Date {
    const date = new Date(dateString);

    // Add 10 hours to get to mid-day from midnight (next service day)
    date.setTime(date.getTime() + 10 * 60 * 60 * 1000);

    return date;
}