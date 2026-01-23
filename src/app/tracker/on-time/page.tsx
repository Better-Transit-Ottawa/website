import { Suspense } from "react";
import PageClient from "./page.client";
import Layout from "@/components/layout";

import "../../tailwind.css"
import "../tracker.css"

export default function Page() {
  return (
    <Layout className="fullsize" footer={<>
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
  title: "OC On-Time Performance",
  description: "Track how on-time OC Transpo routes are",
  openGraph: {
    description: "Track how on-time OC Transpo routes are",
    images: ["https://bettertransitottawa.ca/opengraph-image.png"]
  },
  twitter: {
    card: "summary"
  }
};
