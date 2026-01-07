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
  title: "OC Route Explorer",
  description: "Track which trips have been cancelled",
  openGraph: {
    description: "Track which trips have been cancelled",
    images: ["/opengraph-image.png"]
  },
  twitter: {
    card: "summary"
  }
};