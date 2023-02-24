import { getSheet, setup, TwindConfig } from "https://esm.sh/@twind/core@1.1.3";

export default function hydrate(options: TwindConfig) {
  setup(options, getSheet());
}
