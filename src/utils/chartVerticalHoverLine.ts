import { Chart } from "chart.js";

export const verticalHoverLine = {
    id: "verticalHoverLine",
    beforeDatasetDraw: (chart: Chart) => {
        const { ctx, chartArea: { bottom } } = chart;
        ctx.save();

        const dataSetNumber = chart.data.datasets.length;
        let highestValue: null | number = null;
        let x = 0;
        for (let i = 0; i < dataSetNumber; i++) {
            for (const dataPoint of chart.getDatasetMeta(i).data) {
                if (dataPoint.active === true) {
                    if (!highestValue || dataPoint.y < highestValue) {
                        highestValue = dataPoint.y;
                        x = dataPoint.x;
                        break;
                    }
                }
            }
        }

        if (highestValue !== null) {
            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.moveTo(x, highestValue);
            ctx.lineTo(x, bottom);
            ctx.stroke();
        }
    }
};