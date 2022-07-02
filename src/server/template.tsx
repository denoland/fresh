/** @jsx h */
import { ComponentChildren, createContext, Fragment, h } from "preact";
import { Root, RootProps } from "./types.ts"

export interface TemplateOptions {
  bodyHtml: string;
  headComponents: ComponentChildren[];
  imports: (readonly [string, string])[];
  styles: string[];
  preloads: string[];
  lang: string;
  root: Root;
}

export const TemplateContext = createContext<TemplateOptions | undefined>(undefined);

export function Scripts() {
  return (
    <TemplateContext.Consumer>
      {(context) => {
        return (
          <Fragment>
            {context?.imports.map(([src, nonce]) => (
              <script src={src} nonce={nonce} type="module"></script>
            ))}
          </Fragment>
        );
      }}
    </TemplateContext.Consumer>
  );
}

export function Links() {
  return (
    <TemplateContext.Consumer>
      {(context) => {
        return (
          <Fragment>
            {context?.preloads.map((src) => (
              <link rel="modulepreload" href={src} />
            ))}
          </Fragment>
        );
      }}
    </TemplateContext.Consumer>
  );
}

export function Styles() {
  return (
    <TemplateContext.Consumer>
      {(context) => {
        return (
          <style
            id="__FRSH_STYLE"
            dangerouslySetInnerHTML={{
              __html: context?.styles.join("\n") || "",
            }}
          />
        );
      }}
    </TemplateContext.Consumer>
  );
}

export function Meta() {
  return (
    <TemplateContext.Consumer>
      {(context) => {
        return context?.headComponents;
      }}
    </TemplateContext.Consumer>
  );
}

export function Body() {
  return (
    <TemplateContext.Consumer>
      {(context) => {
        return (
          <body dangerouslySetInnerHTML={{ __html: context?.bodyHtml || "" }} />
        );
      }}
    </TemplateContext.Consumer>
  );
}

export function Template(props: TemplateOptions) {
  const Root = props.root.component;

  return (
    <TemplateContext.Provider value={{ ...props }}>
      <Root lang={props.lang} />
    </TemplateContext.Provider>
  );
}

export function DefaultRoot({ lang }: RootProps) {
  return (
    <html lang={lang}>
      <head>
        <meta charSet="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Links />
        <Scripts />
        <Styles />
        <Meta />
      </head>

      <Body />
    </html>
  );
}
