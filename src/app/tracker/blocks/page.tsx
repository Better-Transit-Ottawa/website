import { Suspense } from "react";
import PageClient from "./page.client";
import Layout from "@/components/layout";

import "../../tailwind.css"
import "../tracker.css"
import "@xyflow/react/dist/style.css";

export default function Page() {
  return (
    <Layout className="fullsize bus-tracker" footer={<>
      <div>
          <a href="https://github.com/Better-Transit-Ottawa/bus-tracker">Bus tracker source code</a>
      </div>
    </>}>
      <div className="text-block fullsize">
        <Suspense>
          <PageClient />
        </Suspense>
      </div>
    </Layout>
  );
}

export const metadata = {
  title: "OC Block Explorer",
  description: "Track where missing buses have gone",
  openGraph: {
    description: "Track where missing buses have gone",
    images: ["https://bettertransitottawa.ca/opengraph-image.png"]
  },
  twitter: {
    card: "summary"
  }
};