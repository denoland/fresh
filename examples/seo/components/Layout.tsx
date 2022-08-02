/** @jsx h */
import { ComponentChildren, h } from "preact";
import { Head, IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";

export interface Meta {
    title?: string,
    type?: string,
    description?: string,
    url?: string,
    image?: string
}

export interface LayoutProps {
    children: ComponentChildren;
    meta: Meta;
}

export default function Layout({ children, meta }: LayoutProps) {
    const seo: Meta = {
        title: meta.title ? meta.title : "Default Title",
        type: meta.type ? meta.type : "website",
        description: meta.description ? meta.description : "A description should indicate the main purpose of a website.",
        url: meta.url ? meta.url : "https://www.seo-example.deno.dev/",
        image: meta.image ? meta.image : "https://www.seo-example.deno.dev/logo.png"
    }

    return (
        <div
            class={tw`p-4 mx-auto max-w-screen-md`}
        >
            <Head>
                <title>{meta.title}</title>

                {/* Robots.txt */}
                <meta name="robots" content="index, follow" />

                {/* Open Graph */}

                <meta property="og:type" content={meta.type} />

                <meta property="og:title" content={meta.title} />

                <meta property="og:description" content={meta.description} />

                <meta property="og:image" content={meta.image} />

                <meta property="og:image:secure_url" content={meta.image} />

                <meta property="og:url" content={meta.url} />

                <meta property="og:site_name" content={meta.title} />

                <meta property="og:image:type" content="image/png" />

                <meta property="og:image:alt" content="the fresh logo: a sliced lemon dripping with juice." />

                {/* Twitter */}

                <meta name="twitter:title" content={meta.title} />

                <meta name="twitter:description" content={meta.description} />

                <meta name="twitter:site" content="@deno_land" />

                <meta name="twitter:creator" content="@deno_land" />

                {/* Canonical */}

                <link rel="canonical" href="https://www.fresh.deno.dev/" />
            </Head>
            {children}
        </div>
    );
}
