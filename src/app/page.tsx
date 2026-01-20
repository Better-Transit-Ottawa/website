import * as React from "react";
import LinkMap from "./components/link-map";
import { Metadata } from "next";
import Layout from "@/components/layout";
import Link from "next/link";
import { basePath } from "../lib/config";

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
            <img src={basePath + "/images/bluesky.svg"} alt="Bluesky logo"/>
          </a>

          <a href="https://www.instagram.com/bettertransitottawa/">
            <img src={basePath + "/images/instagram.svg"} alt="Instagram logo"/>
          </a>

          <a href="https://www.youtube.com/@BetterTransitOttawa">
            <img src={basePath + "/images/youtube.svg"} alt="YouTube logo"/>
          </a>
        </div>

        <section className="text-block" aria-labelledby="latest-posts">
          
          <img className="info-icon" src={basePath + "/images/info.svg"} alt="Info icon" />
          <h2 className="info-bar-title" id="latest-posts">
            Bus Reliability
          </h2>
         

          <ul className="project-list">
            <li>
                <p>
                  {`Work in progress tools to monitor OC Transpo's reliability`}
                </p>

                <Link href="/tracker/route">
                  <h3 className="project-title">
                    Route delay and cancellation tracker
                  </h3>
                </Link>

                <br/>

                <Link href="/tracker/blocks">
                  
                  <h3 className="project-title">
                    Block and bus-movement tracker
                  </h3>

                  <img
                    className="project-image"
                    src={basePath + "/images/graph-5-03.png"}
                    alt="Map of OC Transpo block 5-03"
                  />

                </Link>
              
            </li>
          </ul>
        </section>

        <section className="text-block" aria-labelledby="latest-posts">
          
          <img className="info-icon" src={basePath + "/images/info.svg"} alt="Info icon" />
          <h2 className="info-bar-title" id="latest-posts">
            Latest posts
          </h2>
         

          <ul className="project-list">
            <li>
                <Link href="/blog/budget-2026">
                  
                  <h3 className="project-title">
                    2026 Budget: Our Response
                  </h3>

                  <img
                    className="project-image"
                    src={basePath + "/images/blog/budget-2026/bus.jpg"}
                    alt="OC Transpo bus 4451, our new used bus, next to an STO bus"
                  />
                </Link>
              
            </li>
          </ul>
        </section>

        <section className="text-block" aria-labelledby="projects">
          
          <img className="info-icon" src={basePath + "/images/info.svg"} alt="Info icon" />
          <h2 className="info-bar-title" id="projects">
            Projects that need your help
          </h2>
          

          <ul className="project-list">
            <li>
              <h3 className="project-title">
                Bus lanes on Bank Street
              </h3>

              <img
                className="project-image"
                src={basePath + "/images/bank.jpg"}
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
            </li>
          </ul>
        </section>

        <section className="text-block" aria-labelledby="about-us">
          
          <img className="info-icon" src={basePath + "/images/info.svg"} alt="Info icon" />
          <h2 className="info-bar-title" id="about-us">
            Who We Are
          </h2>
         

          <p>
            We are a group of volunteers fighting for a useful, reliable, and sustainable public transportation network in the City of Ottawa
          </p>

          <p>
            We have distilled our mission down to three core principles:
          </p>

          <ol className="text-block-indented">
            <li>
              <b>Consistency</b>: Infrastructure projects to ensure transit is on-time, reliable, and offers a competitive alternative to driving
            </li>

            <li>
              <b>Sustainability</b>: Operational changes to maintain a reliable network and support future growth
            </li>

            <li>
              <b>Solidarity</b>: Giving power back to front-line transit workers
            </li>
          </ol>
        </section>

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