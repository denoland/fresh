import { options, VNode } from "preact";
import { Config } from "windicss";
import _ from "https://esm.sh/lodash";
import {
  generateWindicss,
  getClassesFromProps,
  STYLE_ELEMENT_ID,
} from "./shared.ts";

/**
 * @see https://preactjs.com/guide/v10/options
 *
 * This function uses preact hook options to get some control over virtual node's props.
 * When classes change, function compares them with the already generated classes
 * and decides if new classes should be generated and appended to the style tag
 *
 * @function hydrate
 *
 * @param config {@link Config}
 * @param existingClasses {string[]}
 */
export default function hydrate(config: Config, existingClasses: string[]) {
  const styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement;
  const styles = styleEl.childNodes[0];

  const originalHook = options.vnode;
  options.vnode = (vnode: VNode<JSX.DOMAttributes<any>>) => {
    const isProps = typeof vnode.props === "object";
    const isType = typeof vnode.type === "string";

    if (isType && isProps) {
      const { props } = vnode;
      const classes = getClassesFromProps(props);
      const classesDiff = _.difference(classes, existingClasses);

      if (classesDiff.length) {
        existingClasses.push(...classesDiff);
        const windicss = generateWindicss(config, classesDiff);
        styles.appendData(windicss);
      }
    }

    originalHook(vnode);
  };
}
