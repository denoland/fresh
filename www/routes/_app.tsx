import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body data-code-lang="ts">
        <Component />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            var savedValue = "ts";
            try {
              var lsValue = localStorage.getItem("fresh-code-lang");
              if (lsValue !== null) {
                savedValue = lsValue;
              }
            } catch (err) {
              // ignore
            }

            document.body.setAttribute("data-code-lang", savedValue);

            var dropdowns = document.querySelectorAll(".fenced-code-dropdown");

            dropdowns.forEach(function (element) {
              element.value = savedValue;
            
              element.addEventListener("input", function (event) {
                var node = event.target;
                var beforeTop = node.getBoundingClientRect().top;

                document.body.setAttribute("data-code-lang", node.value);
                dropdowns.forEach(function (element) {
                  element.value = node.value;
                });

                // Prevent clicked select element from jumping around
                var afterTop = node.getBoundingClientRect().top;
                var delta = afterTop - beforeTop;
                window.scrollTo(window.scrollX, window.scrollY + delta);

                try {
                  localStorage.setItem("fresh-code-lang", node.value);
                } catch (err) {
                  // ignore
                }
              });
            });
          `,
          }}
        />
      </body>
    </html>
  );
}
