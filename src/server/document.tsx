import {
  ComponentChildren,
  ComponentType,
  Fragment,
  h,
} from "../runtime/deps.ts";
import { renderToString } from "./deps.ts";
import { Page } from "./routes.ts";

type DocumentComponent<D> = ComponentType<DocumentProps<D>>;
type DocumentRenderFn<D> = (
  opts: DocumentRenderOptions,
) => DocumentRenderReturn<D>;

export interface DocumentModule<D = any> {
  default: ComponentType<DocumentProps<D>>;
  render: DocumentRenderFn<D>;
}

export interface DocumentProps<D> {
  Head: ComponentType<{ children: ComponentChildren }>;
  Main: ComponentType;
  data: D;
}

export interface DocumentRenderOptions {
  render(): void;
}

export interface DocumentRenderReturn<D> {
  data: D;
}

export interface RenderOptions {
  page: Page;
  imports: string[];
  preloads: string[];
  params: Record<string, string>;
}

export class DocumentHandler<D = unknown> {
  #render: DocumentRenderFn<D>;
  #component: DocumentComponent<D>;

  constructor(module: DocumentModule<D>) {
    this.#component = module.default;
    this.#render = module.render;
  }

  render(opts: RenderOptions): string {
    const props = { params: opts.params };

    let body: string | undefined = undefined;

    function render() {
      if (body !== undefined) {
        throw new TypeError("Can not call `render` more than once.");
      }
      body = renderToString(h(opts.page.component, props));
    }

    const { data } = this.#render({ render });
    if (body === undefined) {
      throw new TypeError(
        "Did not call `render` in document `render` function.",
      );
    }

    const DocumentComponent = this.#component;
    function Head(props: { children: ComponentChildren }) {
      return (
        <head>
          {opts.preloads.map((src) => <link rel="modulepreload" href={src} />)}
          {props.children}
          {opts.imports.map((src) => <script src={src} type="module"></script>)}
        </head>
      );
    }

    const propsStr = JSON.stringify(props);

    function Main() {
      return (
        <>
          <div dangerouslySetInnerHTML={{ __html: body! }} id="__FRSH" />
          <script
            id="__FRSH_PROPS"
            type="application/json"
            dangerouslySetInnerHTML={{ __html: propsStr }}
          />
        </>
      );
    }

    return "<!DOCTYPE html>" +
      renderToString(<DocumentComponent Head={Head} Main={Main} data={data} />);
  }
}

export const DEFAULT_DOCUMENT = new DocumentHandler({
  default: ({ Head, Main }: DocumentProps<undefined>) => {
    return (
      <html>
        <Head>
          <meta charSet="UTF-8" />
          <meta http-equiv="X-UA-Compatible" content="IE=edge" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
        </Head>
        <body>
          <Main />
        </body>
      </html>
    );
  },
  render({ render }) {
    render();
    return { data: undefined };
  },
});
