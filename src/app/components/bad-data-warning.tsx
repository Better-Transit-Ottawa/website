import { isBadDataDate } from "@/utils/busTracker";

interface BadDataWarningProps {
    date: Date;
    cancellations?: boolean
}

export function BadDataWarning(props: BadDataWarningProps) {
    return <>
        {isBadDataDate(props.date, props.cancellations) && 
            <div>
                Warning: Data on this day is incomplete due to missing data (OC Transpo issues or issues on our end)
            </div>
        }
    </>
}