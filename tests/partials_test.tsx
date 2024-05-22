import { App, staticFiles } from "@fresh/core";
import { Partial } from "@fresh/core/runtime";
import {
  assertMetaContent,
  assertNotSelector,
  buildProd,
  charset,
  Doc,
  favicon,
  getIsland,
  parseHtml,
  waitFor,
  waitForText,
  withBrowserApp,
} from "./test_utils.tsx";
import { SelfCounter } from "./fixtures_islands/SelfCounter.tsx";
import { expect } from "@std/expect";
import { PartialInIsland } from "./fixtures_islands/PartialInIsland.tsx";
import { FakeServer } from "../src/test_utils.ts";
import { JsonIsland } from "./fixtures_islands/JsonIsland.tsx";
import * as path from "@std/path";

const loremIpsum = await Deno.readTextFile(
  path.join(import.meta.dirname!, "lorem_ipsum.txt"),
);

function testApp<T>(): App<T> {
  const selfCounter = getIsland("SelfCounter.tsx");
  const partialInIsland = getIsland("PartialInIsland.tsx");
  const jsonIsland = getIsland("JsonIsland.tsx");

  return new App<T>()
    .island(selfCounter, "SelfCounter", SelfCounter)
    .island(partialInIsland, "PartialInIsland", PartialInIsland)
    .island(jsonIsland, "JsonIsland", JsonIsland)
    .use(staticFiles());
}

Deno.test("partials - updates content", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Partial name="foo">
          <p class="output">partial update</p>
        </Partial>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p class="output">hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.click(".update");
    await waitForText(page, ".output", "partial update");
  });
});

Deno.test("partials - revive island not seen before", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      // FIXME: Add outer document
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <SelfCounter />
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p class="init">hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.click(".update");
    await page.waitForSelector(".ready");
    await page.click(".increment");
    await waitForText(page, ".output", "1");

    const doc = parseHtml(await page.content());
    assertNotSelector(doc, ".init");
  });
});

Deno.test("partials - warn on missing partial", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="bar">
            <p class="ready">bar</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p class="init">hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    const logs: string[] = [];
    page.on("console", (msg) => logs.push(msg.text()));

    await page.goto(address);
    await page.click(".update");

    await waitFor(() => logs.find((line) => /^Partial.*not found/.test(line)));
  });
});

Deno.test("partials - errors on duplicate partial name", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p class="ready">foo</p>
            </Partial>
            <Partial name="foo">
              <p class="ready">foo</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  const server = new FakeServer(await app.handler());
  let checked = false;
  try {
    const res = await server.get("/");
    await res.body?.cancel();

    expect(res.status).toEqual(500);
    checked = true;
  } catch {
    // Ignore
  }

  expect(checked).toEqual(true);

  // TODO: Check error overlay
});

// See https://github.com/denoland/fresh/issues/2254
Deno.test("partials - should not be able to override __FRSH_STATE", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <SelfCounter />
            <script id="__FRSH_STATE">{"{}"}</script>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p class="init">hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    let didError = false;
    page.on("pageerror", (ev) => {
      didError = true;
      console.log(ev);
    });

    await page.goto(address);
    await page.click(".update");
    await page.waitForSelector(".ready");

    expect(didError).toEqual(false);
  });
});

Deno.test("partials - finds partial nested in response", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <div>
            <div>
              <Partial name="foo">
                <SelfCounter />
              </Partial>
            </div>
          </div>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p>hello world</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.click(".update");
    await page.waitForSelector(".ready");
  });
});

Deno.test(
  "partials - throws when instantiated inside island",
  async () => {
    const app = testApp()
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <div f-client-nav>
              <PartialInIsland />
            </div>
          </Doc>,
        );
      });

    await buildProd(app);
    const server = new FakeServer(await app.handler());
    let checked = false;
    try {
      const res = await server.get("/");
      await res.body?.cancel();

      expect(res.status).toEqual(500);
      checked = true;
    } catch {
      // Ignore
    }

    expect(checked).toEqual(true);

    // TODO: Test error overlay
  },
);

Deno.test("partials - unmounts island", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p>done</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <SelfCounter />
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
    await page.click(".update");

    await waitFor(async () => {
      const doc = parseHtml(await page.content());
      assertNotSelector(doc, ".increment");
      return true;
    });
  });
});

Deno.test("partials - keeps island state", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p class="partial-update">partial update</p>
            <SelfCounter />
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p class="init">init</p>
              <SelfCounter />
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".partial-update");

    const doc = parseHtml(await page.content());
    const counter = doc.querySelector(".output")?.textContent;
    expect(counter).toEqual("1");
  });
});

Deno.test("partials - replaces island", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p class="partial-update">partial update</p>
            <JsonIsland />
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p class="init">init</p>
              <SelfCounter />
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".partial-update");

    const doc = parseHtml(await page.content());
    const raw = JSON.parse(doc.querySelector("pre")?.textContent!);
    expect(raw).toEqual({ foo: 123 });

    assertNotSelector(doc, ".output");
  });
});

Deno.test("partials - only updates inner partial", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="inner">
            <p class="inner-update">inner update</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="outer">
              <p class="outer">outer</p>
              <Partial name="inner">
                <p class="inner">inner</p>
              </Partial>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".inner");

    await page.click(".update");
    await page.waitForSelector(".inner-update");
  });
});

Deno.test("partials - updates sibling partials", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="sib-1">
            <p class="sib-1-update">sib-1 update</p>
          </Partial>
          <Partial name="sib-2">
            <p class="sib-2-update">sib-2 update</p>
          </Partial>
          <Partial name="sib-3">
            <p class="sib-3-update">sib-3 update</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="sib-1">
              <p class="sib-1">sib-1</p>
            </Partial>
            <Partial name="sib-2">
              <p class="sib-2">sib-2</p>
            </Partial>
            <p>foo</p>
            <Partial name="sib-3">
              <p class="sib-3">sib-3</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".sib-3");
    await page.click(".update");

    await page.waitForSelector(".sib-1-update");
    await page.waitForSelector(".sib-2-update");
    await page.waitForSelector(".sib-3-update");
  });
});

Deno.test("partials - reconcile keyed islands in update", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p key="p" class="done">done</p>
            <SelfCounter key="b" id="b" />
            <SelfCounter key="c" id="c" />
            <SelfCounter key="a" id="a" />
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <p key="p" class="init">init</p>
              <SelfCounter key="a" id="a" />
              <SelfCounter key="b" id="b" />
              <SelfCounter key="c" id="c" />
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click("#a .increment");

    await page.click("#b .increment");
    await page.click("#b .increment");

    await page.click("#c .increment");
    await page.click("#c .increment");
    await page.click("#c .increment");

    await waitForText(page, "#a .output", "1");
    await waitForText(page, "#b .output", "2");
    await waitForText(page, "#c .output", "3");

    await page.click(".update");
    await page.waitForSelector(".done");

    await waitForText(page, "#a .output", "1");
    await waitForText(page, "#b .output", "2");
    await waitForText(page, "#c .output", "3");
  });
});

Deno.test("partials - reconcile keyed partials", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="outer">
            <p key="p" class="done">done</p>
            <Partial key="b" name="b">
              <SelfCounter id="b" />
            </Partial>
            <Partial key="c" name="c">
              <SelfCounter id="c" />
            </Partial>
            <Partial key="a" name="a">
              <SelfCounter id="a" />
            </Partial>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="outer">
              <p key="p" class="init">init</p>

              <Partial key="a" name="a">
                <SelfCounter id="a" />
              </Partial>
              <Partial key="b" name="b">
                <SelfCounter id="b" />
              </Partial>
              <Partial key="c" name="c">
                <SelfCounter id="c" />
              </Partial>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click("#a .increment");

    await page.click("#b .increment");
    await page.click("#b .increment");

    await page.click("#c .increment");
    await page.click("#c .increment");
    await page.click("#c .increment");

    await waitForText(page, "#a .output", "1");
    await waitForText(page, "#b .output", "2");
    await waitForText(page, "#c .output", "3");

    await page.click(".update");
    await page.waitForSelector(".done");

    await waitForText(page, "#a .output", "1");
    await waitForText(page, "#b .output", "2");
    await waitForText(page, "#c .output", "3");
  });
});

Deno.test("partials - reconcile keyed div inside partials", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="outer">
            <p key="p" class="done">done</p>
            <div key="b">
              <SelfCounter id="b" />
            </div>
            <div key="c">
              <SelfCounter id="c" />
            </div>
            <div key="a">
              <SelfCounter id="a" />
            </div>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="outer">
              <p key="p" class="init">init</p>

              <div key="a">
                <SelfCounter id="a" />
              </div>
              <div key="b">
                <SelfCounter id="b" />
              </div>
              <div key="c">
                <SelfCounter id="c" />
              </div>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click("#a .increment");

    await page.click("#b .increment");
    await page.click("#b .increment");

    await page.click("#c .increment");
    await page.click("#c .increment");
    await page.click("#c .increment");

    await waitForText(page, "#a .output", "1");
    await waitForText(page, "#b .output", "2");
    await waitForText(page, "#c .output", "3");

    await page.click(".update");
    await page.waitForSelector(".done");

    await waitForText(page, "#a .output", "1");
    await waitForText(page, "#b .output", "2");
    await waitForText(page, "#c .output", "3");
  });
});

Deno.test(
  "partials - reconcile keyed component inside partials",
  async () => {
    function Foo(props: { id: string }) {
      return <SelfCounter id={props.id} />;
    }

    const app = testApp()
      .get("/partial", (ctx) => {
        return ctx.render(
          <Doc>
            <Partial name="outer">
              <p key="p" class="done">done</p>
              <Foo key="b" id="b" />
              <Foo key="c" id="c" />
              <Foo key="a" id="a" />
            </Partial>
          </Doc>,
        );
      })
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <div f-client-nav>
              <button f-partial="/partial" class="update">update</button>
              <Partial name="outer">
                <p key="p" class="init">init</p>

                <Foo key="a" id="a" />
                <Foo key="b" id="b" />
                <Foo key="c" id="c" />
              </Partial>
            </div>
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector(".ready");

      await page.click("#a .increment");

      await page.click("#b .increment");
      await page.click("#b .increment");

      await page.click("#c .increment");
      await page.click("#c .increment");
      await page.click("#c .increment");

      await waitForText(page, "#a .output", "1");
      await waitForText(page, "#b .output", "2");
      await waitForText(page, "#c .output", "3");

      await page.click(".update");
      await page.waitForSelector(".done");

      await waitForText(page, "#a .output", "1");
      await waitForText(page, "#b .output", "2");
      await waitForText(page, "#c .output", "3");
    });
  },
);

Deno.test(
  "partials - skip key serialization if outside root",
  async () => {
    const app = testApp()
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <p key="outside" class="init">outside</p>
            <Partial name="outer">
              <p key="inside" class="init">inside</p>
            </Partial>
          </Doc>,
        );
      });

    const server = new FakeServer(await app.handler());
    const res = await server.get("/");
    const html = await res.text();

    expect(html).not.toMatch(/frsh:key:outside/);
  },
);

Deno.test("partials - mode replace", async () => {
  let i = 0;
  const app = testApp()
    .get("/partial", (ctx) => {
      const id = i++;
      return ctx.render(
        <Doc>
          <Partial name="outer" mode="replace">
            <p class={`done-${id}`}>{id}</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="outer">
              <p class="init">init</p>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".init");
    await page.click(".update");

    await page.waitForSelector(".done-0");
    await page.click(".update");
    await page.waitForSelector(".done-1");

    const doc = parseHtml(await page.content());
    assertNotSelector(doc, ".init");
    assertNotSelector(doc, ".done-0");
  });
});

Deno.test("partials - mode replace inner", async () => {
  let i = 0;
  const app = testApp()
    .get("/partial", (ctx) => {
      const id = i++;
      return ctx.render(
        <Doc>
          <Partial name="outer">
            <Partial name="inner" mode="replace">
              <p class={`done-${id}`}>{id}</p>
            </Partial>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="outer">
              <Partial name="inner">
                <p class="init">init</p>
              </Partial>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".init");
    await page.click(".update");

    await page.waitForSelector(".done-0");
    await page.click(".update");
    await page.waitForSelector(".done-1");

    const doc = parseHtml(await page.content());
    assertNotSelector(doc, ".init");
    assertNotSelector(doc, ".done-0");
  });
});

Deno.test("partials - mode append", async () => {
  let i = 0;
  const app = testApp()
    .get("/partial", (ctx) => {
      const id = i++;
      return ctx.render(
        <Doc>
          <Partial name="outer" mode="append">
            <p class={`done-${id}`}>{id}</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <div class="content">
              <Partial name="outer">
                <p class="init">init</p>
              </Partial>
            </div>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".init");
    await page.click(".update");

    await page.waitForSelector(".done-0");
    await page.click(".update");
    await page.waitForSelector(".done-1");

    const doc = parseHtml(await page.content());

    expect(doc.querySelector(".content")!.textContent).toEqual("init01");
  });
});

Deno.test("partials - mode append inner", async () => {
  let i = 0;
  const app = testApp()
    .get("/partial", (ctx) => {
      const id = i++;
      return ctx.render(
        <Doc>
          <Partial name="outer">
            <Partial name="inner" mode="append">
              <p class={`done-${id}`}>{id}</p>
            </Partial>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <div class="content">
              <Partial name="outer">
                <Partial name="inner">
                  <p class="init">init</p>
                </Partial>
              </Partial>
            </div>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".init");
    await page.click(".update");

    await page.waitForSelector(".done-0");
    await page.click(".update");
    await page.waitForSelector(".done-1");

    const doc = parseHtml(await page.content());
    expect(doc.querySelector(".content")!.textContent).toEqual("init01");
  });
});

Deno.test("partials - mode prepend", async () => {
  let i = 0;
  const app = testApp()
    .get("/partial", (ctx) => {
      const id = i++;
      return ctx.render(
        <Doc>
          <Partial name="outer" mode="prepend">
            <p class={`done-${id}`}>{id}</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <div class="content">
              <Partial name="outer">
                <p class="init">init</p>
              </Partial>
            </div>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".init");
    await page.click(".update");

    await page.waitForSelector(".done-0");
    await page.click(".update");
    await page.waitForSelector(".done-1");

    const doc = parseHtml(await page.content());
    expect(doc.querySelector(".content")!.textContent).toEqual("10init");
  });
});

Deno.test("partials - mode prepend inner", async () => {
  let i = 0;
  const app = testApp()
    .get("/partial", (ctx) => {
      const id = i++;
      return ctx.render(
        <Doc>
          <Partial name="outer">
            <Partial name="inner" mode="prepend">
              <p class={`done-${id}`}>{id}</p>
            </Partial>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <div class="content">
              <Partial name="outer">
                <Partial name="inner">
                  <p class="init">init</p>
                </Partial>
              </Partial>
            </div>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".init");
    await page.click(".update");

    await page.waitForSelector(".done-0");
    await page.click(".update");
    await page.waitForSelector(".done-1");

    const doc = parseHtml(await page.content());
    expect(doc.querySelector(".content")!.textContent).toEqual("10init");
  });
});

Deno.test("partials - navigate", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p class="done">done</p>
            <SelfCounter />
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <a href="/partial" class="update">update</a>
            <Partial name="foo">
              <p class="init">init</p>
              <SelfCounter />
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".done");
    let url = new URL(await page.url());

    expect(url.pathname).toEqual("/partial");
    await waitForText(page, ".output", "1");

    await page.goBack();

    await page.waitForSelector(".init");
    url = new URL(await page.url());
    expect(url.pathname).toEqual("/");
  });
});

Deno.test("partials - uses f-partial instead", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p class="done">done</p>
            <SelfCounter />
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <a href="/foo" f-partial="/partial" class="update">update</a>
            <Partial name="foo">
              <p class="init">init</p>
              <SelfCounter />
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".done");

    let url = new URL(await page.url());
    expect(url.pathname).toEqual("/foo");
    await waitForText(page, ".output", "1");

    await page.goBack();

    await page.waitForSelector(".init");
    url = new URL(await page.url());
    expect(url.pathname).toEqual("/");
  });
});

Deno.test("partials - opt out of parital navigation", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <h1 class="fail">Fail</h1>
          </Partial>
        </Doc>,
      );
    })
    .get("/foo", (ctx) =>
      ctx.render(
        <Doc>
          <Partial name="foo">
            <h1 class="done">done</h1>
            <SelfCounter />
          </Partial>
        </Doc>,
      ))
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <a
              href="/foo"
              f-client-nav={false}
              f-partial="/partial"
              class="update"
            >
              update
            </a>
            <Partial name="foo">
              <p class="init">init</p>
              <SelfCounter />
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".done");

    const url = new URL(await page.url());
    expect(url.pathname).toEqual("/foo");
    await waitForText(page, ".output", "0");
  });
});

Deno.test("partials - opt out of parital navigation #2", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <h1 class="fail">Fail</h1>
          </Partial>
        </Doc>,
      );
    })
    .get("/foo", (ctx) =>
      ctx.render(
        <Doc>
          <Partial name="foo">
            <h1 class="done">done</h1>
            <SelfCounter />
          </Partial>
        </Doc>,
      ))
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <div>
              <div f-client-nav={false}>
                <a
                  href="/foo"
                  f-partial="/partial"
                  class="update"
                >
                  update
                </a>
              </div>
            </div>
            <Partial name="foo">
              <p class="init">init</p>
              <SelfCounter />
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".done");

    const url = new URL(await page.url());
    expect(url.pathname).toEqual("/foo");
    await waitForText(page, ".output", "0");
  });
});

Deno.test("partials - restore scroll position", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <h1 class="partial-content">foo</h1>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <Partial name="foo">
              {new Array(10).fill(0).map(() => {
                return <p>{loremIpsum}</p>;
              })}
              <p class="init">init</p>
            </Partial>
            <p>
              <a
                class="update"
                href="/partial"
              >
                update
              </a>
            </p>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.evaluate(() => {
      document.querySelector(".update")?.scrollIntoView({
        behavior: "instant",
      });
    });
    await page.click(".update");

    await page.waitForSelector(".partial-content");
    await page.goBack();
    await page.waitForSelector(".init");
    const scroll = await page.evaluate(() => ({ scrollX, scrollY }));

    expect(scroll.scrollY > 100).toEqual(true);
  });
});

Deno.test("partials - submit form", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p class={"done-" + ctx.url.searchParams.get("name")!}>done</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <form action="/partial">
              <input name="name" value="foo" />
              <Partial name="foo">
                <p class="init">init</p>
              </Partial>
              <SelfCounter />
              <button class="update">
                update
              </button>
            </form>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".done-foo");
  });
});

Deno.test("partials - submit form f-partial", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p class={"done-" + ctx.url.searchParams.get("name")!}>done</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <form action="/foo" f-partial="/partial">
              <input name="name" value="foo" />
              <Partial name="foo">
                <p class="init">init</p>
              </Partial>
              <SelfCounter />
              <button class="update">
                update
              </button>
            </form>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".done-foo");
  });
});

Deno.test("partials - submit form POST", async () => {
  const app = testApp()
    .post("/partial", async (ctx) => {
      const data = await ctx.req.formData();
      const name = data.get("name");
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p class={"done-" + name}>done</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <form action="/partial" method="post">
              <input name="name" value="foo" />
              <Partial name="foo">
                <p class="init">init</p>
              </Partial>
              <SelfCounter />
              <button class="update">
                update
              </button>
            </form>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".done-foo");
  });
});

Deno.test("partials - submit form via external submitter", async () => {
  const app = testApp()
    .post("/partial", async (ctx) => {
      const data = await ctx.req.formData();
      const name = data.get("name");
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <p class={"done-" + name}>done</p>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <form action="/foo" id="foo">
              <input name="name" value="foo" />
              <Partial name="foo">
                <p class="init">init</p>
              </Partial>
              <SelfCounter />
              <button>
                nothing
              </button>
            </form>
            <button
              type="submit"
              class="update"
              form="foo"
              formaction="/partial"
              formmethod="POST"
            >
              submit
            </button>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");

    await page.click(".increment");
    await waitForText(page, ".output", "1");

    await page.click(".update");
    await page.waitForSelector(".done-foo");
  });
});

Deno.test(
  "partials - submit form via external submitter f-partial",
  async () => {
    const app = testApp()
      .post("/partial", async (ctx) => {
        const data = await ctx.req.formData();
        const name = data.get("name");
        return ctx.render(
          <Doc>
            <Partial name="foo">
              <p class={"done-" + name}>done</p>
            </Partial>
          </Doc>,
        );
      })
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <div f-client-nav>
              <form action="/foo" id="foo">
                <input name="name" value="foo" />
                <Partial name="foo">
                  <p class="init">init</p>
                </Partial>
                <SelfCounter />
                <button>
                  nothing
                </button>
              </form>
              <button
                type="submit"
                class="update"
                form="foo"
                formaction="/foo"
                formmethod="POST"
                f-partial="/partial"
              >
                submit
              </button>
            </div>
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector(".ready");

      await page.click(".increment");
      await waitForText(page, ".output", "1");

      await page.click(".update");
      await page.waitForSelector(".done-foo");
    });
  },
);

Deno.test(
  "partials - don't apply partials when submitter has client nav disabled",
  async () => {
    const app = testApp()
      .post("/partial", async (ctx) => {
        const data = await ctx.req.formData();
        const name = data.get("name");
        return ctx.render(
          <Doc>
            <Partial name="foo">
              <p class={"done-" + name}>done</p>
            </Partial>
          </Doc>,
        );
      })
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <div f-client-nav>
              <form action="/foo" id="foo">
                <input name="name" value="foo" />
                <Partial name="foo">
                  <p class="init">init</p>
                </Partial>
                <SelfCounter />
                <button>
                  nothing
                </button>
              </form>
              <button
                f-client-nav={false}
                type="submit"
                class="update"
                form="foo"
                formaction="/partial"
                formmethod="POST"
                f-partial="/partial"
              >
                submit
              </button>
            </div>
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.waitForSelector(".ready");

      await page.click(".increment");
      await waitForText(page, ".output", "1");

      await Promise.all([
        page.waitForNavigation(),
        page.click(".update"),
      ]);
      await page.waitForSelector(".done-foo");

      const doc = parseHtml(await page.content());
      assertNotSelector(doc, "button");
    });
  },
);

Deno.test(
  "partials - fragment nav should not cause infinite loop",
  async () => {
    const app = testApp()
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <div f-client-nav>
              <h1 id="foo">Same nav</h1>
              <a href="#foo">#foo</a>
            </div>
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      const logs: string[] = [];
      page.on("console", (msg) => logs.push(msg.text()));

      await page.goto(address);
      await page.waitForSelector("a");

      await page.click("a");
      await page.waitForFunction(() => location.hash === "#foo");
      expect(logs).toEqual([]);
    });
  },
);

Deno.test(
  "partials - fragment navigation should not scroll to top",
  async () => {
    const app = testApp()
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <div f-client-nav>
              {new Array(10).fill(0).map(() => {
                return <p>{loremIpsum}</p>;
              })}
              <h1 id="foo">Same nav</h1>
              <a href="#foo">#foo</a>
              <Partial name="foo">
                <p class="partial-text">
                  foo partial
                </p>
              </Partial>
            </div>
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);

      await page.click("a");
      await page.waitForFunction(() => location.hash === "#foo");
      const scroll = await page.evaluate(() => globalThis.scrollY);
      expect(scroll > 0).toEqual(true);
    });
  },
);

Deno.test(
  "partials - throws an error when response contains no partials",
  async () => {
    const app = testApp()
      .get("/partial", (ctx) =>
        ctx.render(
          <Doc>
            <p class="status-append">append content</p>
          </Doc>,
        ))
      .get("/", (ctx) => {
        return ctx.render(
          <Doc>
            <div f-client-nav>
              <Partial name="body">
                <p class="init">
                  init
                </p>
              </Partial>
              <p>
                <button class="update" f-partial="/partial">
                  update
                </button>
              </p>
            </div>
          </Doc>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      const logs: string[] = [];
      page.on("pageerror", (msg) => logs.push(msg.message));

      await page.goto(address);
      await page.click(".update");

      await waitFor(() => logs.length > 0);
      expect(logs[0]).toMatch(/Found no partials/);
    });
  },
);

Deno.test("partials - merges <head> content", async () => {
  const app = testApp()
    .get("/other.css", () =>
      new Response("h1 { color: red }", {
        headers: {
          "Content-Type": "text/css",
        },
      }))
    .get("/partial", (ctx) => {
      return ctx.render(
        <html>
          <head>
            {charset}
            {favicon}
            <title>Head merge updated</title>
            <meta name="foo" content="bar baz" />
            <meta property="og:foo" content="og value foo" />
            <meta property="og:bar" content="og value bar" />
            <link rel="stylesheet" href="/other.css" />
            <style>{`p { color: green }`}</style>
          </head>
          <body f-client-nav>
            <Partial name="body">
              <h1>updated heading</h1>
              <p class="updated">
                updated
              </p>
            </Partial>
          </body>
        </html>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <html>
          <head>
            {charset}
            {favicon}
            <title>Head merge</title>
            <meta name="foo" content="bar" />
            <meta property="og:foo" content="og value foo" />
            <style id="style-foo">{`.foo { color: red}`}</style>
          </head>
          <body f-client-nav>
            <Partial name="body">
              <p class="init">
                init
              </p>
            </Partial>
            <p>
              <button class="update" f-partial="/partial">
                update
              </button>
            </p>
          </body>
        </html>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);

    await page.click(".update");
    await page.waitForSelector(".updated");

    await waitFor(async () => {
      return (await page.title()) === "Head merge updated";
    });

    const doc = parseHtml(await page.content());
    expect(doc.title).toEqual("Head merge updated");

    assertMetaContent(doc, "foo", "bar baz");
    assertMetaContent(doc, "og:foo", "og value foo");
    assertMetaContent(doc, "og:bar", "og value bar");

    const color = await page.$eval("h1", (el) => {
      return globalThis.getComputedStyle(el).color;
    });
    expect(color).toEqual("rgb(255, 0, 0)");

    const textColor = await page.$eval("p", (el) => {
      return globalThis.getComputedStyle(el).color;
    });
    expect(textColor).toEqual("rgb(0, 128, 0)");
  });
});

Deno.test(
  "partials - does not merge duplicate <head> content",
  async () => {
    const app = testApp()
      .get("/style.css", () =>
        new Response("h1 { color: red }", {
          headers: {
            "Content-Type": "text/css",
          },
        }))
      .get("/partial", (ctx) => {
        return ctx.render(
          <html>
            <head>
              {charset}
              {favicon}
              <title>Head merge duplicated</title>
              <meta name="foo" content="bar" />
              <meta property="og:foo" content="og value foo" />
              <link rel="stylesheet" href="/style.css" />
              <style id="style-foo">{`.foo { color: red}`}</style>
            </head>
            <body f-client-nav>
              <Partial name="body">
                <p class="updated">
                  updated
                </p>
              </Partial>
              <p>
                <button class="update" f-partial="/partial">
                  update
                </button>
              </p>
            </body>
          </html>,
        );
      })
      .get("/", (ctx) => {
        return ctx.render(
          <html>
            <head>
              {charset}
              {favicon}
              <title>Head merge</title>
              <meta name="foo" content="bar" />
              <meta property="og:foo" content="og value foo" />
              <link rel="stylesheet" href="/style.css" />
              <style id="style-foo">{`.foo { color: red}`}</style>
            </head>
            <body f-client-nav>
              <Partial name="body">
                <p class="init">
                  init
                </p>
              </Partial>
              <p>
                <button class="update" f-partial="/partial">
                  update
                </button>
              </p>
            </body>
          </html>,
        );
      });

    await withBrowserApp(app, async (page, address) => {
      await page.goto(address);
      await page.click(".update");
      await page.waitForSelector(".updated");

      await waitFor(async () => {
        return (await page.title()) === "Head merge duplicated";
      });

      const html = await page.content();
      expect(
        Array.from(html.matchAll(/id="style-foo"/g)).length === 1,
      ).toEqual(true);

      expect(
        Array.from(html.matchAll(/style\.css/g)).length === 1,
      ).toEqual(true);
    });
  },
);

Deno.test("supports relative links", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      const { searchParams } = ctx.url;
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <Partial name="body">
              <p
                class={searchParams.has("refresh")
                  ? "status-refreshed"
                  : "status-initial"}
              >
                {searchParams.has("refresh")
                  ? "Refreshed content"
                  : "Initial content"}
              </p>
            </Partial>
            <p>
              <button f-partial="?refresh">
                refresh
              </button>
            </p>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".status-initial");

    await page.click("button");
    await page.waitForSelector(".status-refreshed");
  });
});

Deno.test("partials - update stateful inner partials", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="inner">
            <p class="done">done</p>
            <SelfCounter id="inner" />
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="outer">
              <SelfCounter id="outer" />
              <Partial name="inner">
                <p>init</p>
                <SelfCounter id="inner" />
              </Partial>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector(".ready");
    await page.click("#outer .increment");
    await page.click("#outer .increment");

    await page.click("#inner .increment");

    await waitForText(page, "#outer .output", "2");
    await waitForText(page, "#inner .output", "1");

    await page.click(".update");
    await page.waitForSelector(".done");

    await waitForText(page, "#outer .output", "2");
    await waitForText(page, "#inner .output", "1");
  });
});

Deno.test("partials - with redirects", async () => {
  const app = testApp()
    .get("/a", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <h1 class="done">foo update</h1>
          </Partial>
        </Doc>,
      );
    })
    .get("/partial", (ctx) => ctx.redirect("/a"))
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <h1>foo</h1>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector("h1");
    await page.click(".update");
    await page.waitForSelector(".done");
  });
});

Deno.test("partials - render 404 partial", async () => {
  const app = testApp()
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <h1>foo</h1>
            </Partial>
          </div>
        </Doc>,
      );
    })
    .get("*", (ctx) => {
      return ctx.render(
        <Doc>
          <Partial name="foo">
            <h1 class="error-404">404</h1>
          </Partial>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector("h1");
    await page.click(".update");
    await page.waitForSelector(".error-404");
  });
});

Deno.test("partials - render with new title", async () => {
  const app = testApp()
    .get("/partial", (ctx) => {
      return ctx.render(
        <Doc title="after update">
          <Partial name="foo">
            <h1 class="done">foo update</h1>
          </Partial>
        </Doc>,
      );
    })
    .get("/", (ctx) => {
      return ctx.render(
        <Doc>
          <div f-client-nav>
            <button f-partial="/partial" class="update">update</button>
            <Partial name="foo">
              <h1>foo</h1>
            </Partial>
          </div>
        </Doc>,
      );
    });

  await withBrowserApp(app, async (page, address) => {
    await page.goto(address);
    await page.waitForSelector("h1");
    await page.click(".update");
    await page.waitForSelector(".done");

    const title = await page.evaluate(() => document.title);
    expect(title).toEqual("after update");
  });
});
