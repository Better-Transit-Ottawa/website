import { Chart } from "chart.js";

export const verticalHoverLine = (index: number) => ({
    id: "verticalHoverLine",
    beforeDatasetDraw: (chart: Chart) => {
        const { ctx, chartArea: { bottom } } = chart;
        ctx.save();

        for (const dataPoint of chart.getDatasetMeta(index).data) {
            if (dataPoint.active === true) {
                ctx.beginPath();
                ctx.strokeStyle = "white";
                ctx.moveTo(dataPoint.x, dataPoint.y);
                ctx.lineTo(dataPoint.x, bottom);
                ctx.stroke();
            }
        }
    }
});