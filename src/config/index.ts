// biome-ignore-all lint/performance/noBarrelFile: S0b requires this module to re-export the config contract
export { default as bordfulConfig } from "../../bordful.config";
export {
  type BordfulConfig,
  type BordfulConfigInput,
  defineBordfulConfig,
} from "./define-config";
