import React, { useState } from 'react';
import { useReactFlow, getViewportForBounds } from '@xyflow/react';
import { toPng } from 'html-to-image';
import { Button } from '@/components/ui/button';

// https://reactflow.dev/examples/misc/download-image
 
function downloadImage(dataUrl: string) {
  const a = document.createElement('a');
 
  a.setAttribute('download', 'reactflow.png');
  a.setAttribute('href', dataUrl);
  a.click();
}
 
function DownloadButton() {
    const [generating, setGenerating] = useState(false);
    const { getNodes, getNodesBounds } = useReactFlow();

    const onClick = () => {
        setGenerating(true)
        const nodes = getNodes();
        const nodesBounds = getNodesBounds(nodes);

        const imageWidth = nodesBounds.width;
        const imageHeight = nodesBounds.height;

        const viewport = getViewportForBounds(nodesBounds, imageWidth, imageHeight, 0.5, 2, {});

        setTimeout(() => {
            toPng(document.querySelector('.react-flow__viewport') as HTMLElement, {
                backgroundColor: '#000000',
                width: imageWidth,
                height: imageHeight,
                style: {
                width: String(imageWidth),
                height: String(imageHeight),
                transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
                },
            }).then((u) => {
                downloadImage(u);

                setGenerating(false);
            });
        }, 1);
    };

    return (
        <Button variant={"outline"} onClick={onClick}>
            {!generating ? "Download Image" : "Generating..."}
        </Button>
    );
}
 
export default DownloadButton;