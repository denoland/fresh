const meta = document.createElement("meta");
meta.name = "foo";
meta.content = "bar";
document.head.appendChild(meta);


const res = await fetch("/foo.txt");
const text = await res.text();

const p = document.createElement("p");
p.className = "foo-text"
p.textContent = text;
document.body.appendChild(p)
