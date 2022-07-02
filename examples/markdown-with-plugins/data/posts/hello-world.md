---
title: 'Hello, World!'
publishedOn: '2022-07-02'
image: 'https://images.unsplash.com/photo-1587324438673-56c78a866b15?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1480&q=80'
---

```js
// here's some heavily customized syntax highlighting
const loremFetcher = async (id: string) => {
  const url = `https://jsonplaceholder.typicode.com/comments`;
  const ipsum = await fetch(`${url}/?postId=${id}`);
  const text = await ipsum.text();
  return text;
};
```

## lorem

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque ac ornare orci, vitae condimentum urna. Donec et nisi in odio tempus pharetra sed id nibh. Cras lacinia, magna ut accumsan rutrum, ante nisi dignissim lorem, sed aliquet urna mi at lacus. Vivamus eu nunc justo.

## ipsum

Nulla eu bibendum enim, non aliquam elit. Suspendisse id nunc risus. Sed tempor justo non neque vestibulum, ut elementum dui consequat. Donec semper mi ante, ut sollicitudin dolor convallis nec.
