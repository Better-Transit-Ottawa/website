import Link from "next/link";
import { basePath } from "../lib/config";

export interface LayoutProps {
    children: React.ReactNode;
    footer?: React.ReactNode;
    dontLink?: boolean;
    className?: string;
}


export default function Layout({ children, footer, dontLink, className }: LayoutProps) {
    className ??= "";

    return (
        <>
            <div className="background-container">
                <div className="background"/>
            </div>

            <main className={"content " + className}>
                <header>
                    
                        <Link href="/" className={"title" + (dontLink ? " disabled" : "")}>
                            <div className="logo">
                                <img src={basePath + "/images/logo-square.svg"} alt="Logo" />
                            </div>

                            <h1 className="title-text">Better Transit Ottawa</h1>
                        </Link>

                    

                </header>
                
                {children}

                <footer>
                    {footer}

                    <div>
                        Contact: contact[at]bettertransitottawa.ca
                    </div>
                    <div>
                        <a href="https://github.com/Better-Transit-Ottawa/website">Website source code</a>
                    </div>
                </footer>
            </main>
        </>
    )
}