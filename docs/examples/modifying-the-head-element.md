# Modifying Web Page Metadata via the ```<Head /> ```Element

  We can use the ``` <Head /> ``` component in ```/runtime.ts``` to modify the ``` <head /> ``` element. For example:  
  ``` 
import { Head } from "$fresh/runtime.ts";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <>
      <Head>  
        <title>Fresh App</title>
        <p>Fresh App</p>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <img
          src="/logo.svg"
          class="w-32 h-32"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <p class="my-6">
          Welcome to `fresh`. Try updating this message in the
          ./routes/index.tsx file, and refresh.
        </p>
        <Counter start={3 } />
        </div>
    </>
  );
}

```  
![Alt text](image/Head.png)  
By adding changes to the inner components of ``` <Head /> ``` we can add a new  paragraph to the ``` <head /> ``` element of the display page. 
