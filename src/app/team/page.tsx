import * as React from "react";
import { Metadata } from "next";
import Layout from "@/components/layout";
import Link from "next/link";

interface AboutMe {
    name: string;
    pronouns: string;
    contact: Array<{
        name: string,
        url?: string;
    }>;
    neighbourhood?: string;
    favouriteVehicle?: string;
    description?: string;
}

const names: AboutMe[] = shuffle([{
    name: "Griffin",
    pronouns: "they/them",
    contact: [{
        name: "griffin@bettertransitottawa.ca",
        url: "mailto:griffin@bettertransitottawa.ca"
    }],
    neighbourhood: "Vanier",
    favouriteVehicle: "Inveros and XE40s",
    description: "Griffin is one of the co-founders of Better Transit Ottawa (BTO) with a particular interest in next stop announcement systems, headsigns, passenger information displays, and just generally all things related to telling people where they are and where they’re going. They write and edit much of the text you see throughout BTO. When not researching or editing, they love meeting new people and spreading knowledge about the current state of Ottawa’s transit network."
}, {
    name: "Keira Clarke",
    pronouns: "she/her",
    contact: [{
        name: "keira@bettertransitottawa.ca",
        url: "mailto:keira@bettertransitottawa.ca"
    }, {
        name: "@keiraclarke.ca",
        url: "https://bsky.app/profile/keiraclarke.ca/"
    }, {
        name: "@keirastrains on YouTube",
        url: "https://www.youtube.com/@keirastrains"
    }],
    neighbourhood: "Alta Vista",
    favouriteVehicle: "Stadler FLIRT",
    description: "Imported from Chatham, ON, Keira is a 4th year Computer Science student at Carleton University with a passion for trains and public transit. As a member of Transport Action Canada, she helps to coordinate with them to further our common goals. Please critique her French, she's trying her best."
}, {
    name: "Rikki MacMullin",
    pronouns: "she/her",
    contact: [{
        name: "yuka@bettertransitottawa.ca",
        url: "mailto:yuka@bettertransitottawa.ca"
    }, {
        name: "@yuka.10 on signal"
    }],
    neighbourhood: "Nepean",
    favouriteVehicle: "Alstom Coradia LINT",
    description: "Rikki is the Communications and marketing lead for Better Transit Ottawa, and a future TMU Urban Planning student."
}, {
    name: "Lennon",
    pronouns: "he/him",
    contact: [{
        name: "lennon@bettertransitottawa.ca",
        url: "mailto:lennon@bettertransitottawa.ca"
    }, {
        name: "@lennon.transit on IG",
        url: "https://instagram.com/lennon.transit"
    }],
    favouriteVehicle: "New Flyer D40i Invero",
    description: "Lennon is Better Transit Ottawa's social media manager, video editor, and photographer. He is well known in the community for his amazing photos of transit vehicles. While taking pics, he loves connecting with transit operators and spreading his love for buses."
}, {
    name: "Jim McAvoy",
    pronouns: "he/him",
    contact: [{
        name: "habsinottawa@gmail.com",
        url: "mailto:habsinottawa@gmail.com"
    }, {
        name: "@hockeyinottawa.bsky.social",
        url: "https://bsky.app/profile/hockeyinottawa.bsky.social/"
    }],
    neighbourhood: "Barrhaven",
    favouriteVehicle: "Stadler FLIRT",
    description: "Jokingly referred to as Gramps (not actually that old), Jim works with the rest of the team on managing the Discord server and coming up with policy positions. Going through a mid-life career change, he is in third year Geomatics at Carleton, and fosters a particular interest in trains. Working with BTO is his way of trying to make Ottawa’s transit system as good as it can be (and subtly trying to get more rail while he’s at it)."
}, {
    name: "Ajay Ramachandran",
    pronouns: "he/him",
    contact: [{
        name: "ajay@bettertransitottawa.ca",
        url: "mailto:ajay@bettertransitottawa.ca"
    }, {
        name: "ajay.app",
        url: "https://ajay.app"
    }],
    description: "Ajay is a software developer who helps develop our data analysis tools as well as talking about transit in front of City Council."
}, {
    name: "Stephon Farrow",
    pronouns: "he/him",
    contact: [{
        name: "@occasional_transpo on IG",
        url: "https://instagram.com/occasional_transpo"
    }],
    neighbourhood: "The Glebe",
    favouriteVehicle: "Bombardier MR-73",
    description: "Oshawa refugee and transit enthusiast. He has just finished his undergrad at Carleton in Public Affairs and Policy Management (BPAPM). Stephon assists BTO with policy related matters. He spends his free time walking around and photographing buses. Don’t ask him about the Oshawa gondola project."
}]);


// From https://javascript.info/task/shuffle
function shuffle<T>(array: Array<T>): Array<T> {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i
    [array[i], array[j]] = [array[j], array[i]];
  }

  return array;
}

export default function Home() {
  return (
    <Layout>
      <section className="text-block" aria-labelledby="the-team">
        <ul className="project-list about-me">
            {names.map((name, i) =>
                <li key={i} className="about-me-item">
                    <AboutMe me={name}/>
                </li>
            )}
        </ul>
      </section>
    </Layout>
  );
}

function AboutMe({ me }: { me: AboutMe }) {
    return <>
        <div className="about-name">
            {me.name}
        </div>
        <div className="about-pronouns">
            {me.pronouns}
        </div>
        {me.neighbourhood && 
            <div>
                Neighbourhood: {me.neighbourhood}
            </div>
        }
        {me.favouriteVehicle && 
            <div>
                Favourite Vehicle: {me.favouriteVehicle}
            </div>
        }
        {me.contact.map((c, i) => (
            c.url ?
                <Link href={c.url} key={i}>
                    {c.name}
                </Link>
            :
                <div key={i}>
                    {c.name}
                </div>
        ))}
        {me.description && 
            <div className="about-description">
                {me.description}
            </div>
        }
    </>
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About the team",
    metadataBase: new URL("https://bettertransitottawa.ca"),
    twitter: {
      card: "summary",
    },
  };
}
