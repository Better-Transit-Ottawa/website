import * as React from "react";
import LinkMap from "./components/link-map";
import { Metadata } from "next";
import Layout from "@/components/layout";
import Link from "next/link";

export default function Home() {
  return (
    <Layout
      dontLink={true}
      footer={
        <>
          <div>
            Bank street photo credit:{" "}
            Mike Wright
          </div>
        </>
      }>
        <div className="description">
          {`Let's make public transit in Ottawa better`}
        </div>

        <a className="join" href="https://discord.gg/T7HzadcpSX">
          Join us on Discord
        </a>

        <div className="socials">
          <a href="https://bsky.app/profile/bettertransitottawa.ca">
            <img src="/images/bluesky.svg" alt="Bluesky logo"/>
          </a>

          <a href="https://www.instagram.com/bettertransitottawa/">
            <img src="/images/instagram.svg" alt="Instagram logo"/>
          </a>

          <a href="https://www.youtube.com/@BetterTransitOttawa">
            <img src="/images/youtube.svg" alt="YouTube logo"/>
          </a>
        </div>

        <div className="text-block">
          <p className="info-bar">
            <img className="info-icon" src="/images/info.svg" alt="Info icon" />

            <span className="info-bar-title">
              Latest posts
            </span>
          </p>

          <div className="project-list">
            <div>
              <p className="project-title">
                <Link href="/blog/budget-2026">
                  2026 Budget: Our Response

                  <img
                    className="project-image"
                    src="/images/blog/budget-2026/bus.jpg"
                    alt="OC Transpo bus 4451, our new used bus, next to an STO bus"
                  />
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-block">
          <p className="info-bar">
            <img className="info-icon" src="/images/info.svg" alt="Info icon" />

            <span className="info-bar-title">
              Projects that need your help
            </span>
          </p>

          <div className="project-list">
            <div>
              <p className="project-title">
                Bus lanes on Bank Street
              </p>

              <img
                className="project-image"
                src="/images/bank.jpg"
                alt="An OC Transpo bus on Bank street"
              />

              <p>
                The city is currently studying replacing parking with dedicated bus lanes on a portion of bank street. We need your help to help them make the right decision!
              </p>

              <p className="project-actions-title">
                Actions:
              </p>

              <p>
                <a target="_blank" href="https://docs.google.com/forms/d/e/1FAIpQLSdmP_jogr7Us53LxbrZtcIP5SOANRQ3te-9Y24k1XfTj5pY2Q/viewform">
                  Sign the petition
                </a>
              </p>

              <p>
                <a target="_blank" href="https://strongtownsottawa.ca/bank/">
                  Learn why this is important
                </a>
              </p>

              <p>
                <Link href="/blog/bank-bus-lanes">
                  Our problems with the current proposal
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="text-block">
          <p className="info-bar">
            <img className="info-icon" src="/images/info.svg" alt="Info icon" />

            <span className="info-bar-title">
              Who We Are
            </span>
          </p>

          <p>
            We are a group of volunteers fighting for a useful, reliable, and sustainable public transportation network in the City of Ottawa
          </p>

          <p>
            We have distilled our mission down to three core principles:
          </p>

          <div className="text-block-indented">
            <p>
              <b>Consistency</b>: Infrastructure projects to ensure transit is on-time, reliable, and offers a competitive alternative to driving
            </p>

            <p>
              <b>Sustainability</b>: Operational changes to maintain a reliable network and support future growth
            </p>

            <p>
              <b>Solidarity</b>: Giving power back to front-line transit workers
            </p>
          </div>
        </div>

        <LinkMap
          links={[
            {
              name: "Better Transit Ottawa",
              url: "https://discord.gg/9gQzNpp3QT",
              logo: "/images/logo.svg",
            },
            {
              name: "Transit Ottawa Blog",
              url: "https://otransitottawa.blogspot.com/",
            },
            {
              name: "alex-is.online",
              url: "https://alex-is.online/docs",
            },
            {
              name: "yukaira",
              url: "https://www.youtube.com/playlist?list=PL8vl2ZW-HDQwPZL3edNEiA424IPwUWm3y",
            },
            {
              name: "There Was a Station Here Blog",
              url: "https://therewasastationhere.wordpress.com/"
            },
            {
              name: "lennon.transit",
              url: "https://www.instagram.com/lennon.transit/"
            },
            {
              name: "Strong Towns Ottawa",
              url: "https://strongtownsottawa.ca/bank/",
            },
            {
              name: "Bank Street Action Group",
              url: "https://www.banktransitaction.ca/",
            },
            {
              name: "Ottawa Transit Riders",
              url: "https://www.ottawatransitriders.ca/",
            },
            {
              name: "Free Transit Ottawa",
              url: "https://freetransitottawa.ca/",
            },
          ]}
        />
    </Layout>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Better Transit Ottawa",
    description: "Let's make public transit in Ottawa better",
    openGraph: {
      description: "Let's make public transit in Ottawa better"
    },
    metadataBase: new URL("https://bettertransitottawa.ca"),
    twitter: {
      card: "summary"
    }
  };
}