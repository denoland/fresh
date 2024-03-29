export default function PropIsland(
  props: {
    number: number;
    string: string;
    boolean: boolean;
    strArr: string[];
    obj: { foo: number };
  },
) {
  return (
    <pre class="pre-props">
      {JSON.stringify({
        number: props.number,
        string: props.string,
        null: null,
        boolean: props.boolean,
        object: props.obj,
        strArr: props.strArr,
      },null,2)}
    </pre>
  );
}
