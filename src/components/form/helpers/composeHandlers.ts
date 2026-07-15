import { callAll } from "./callAll";

export function composeHandlers<Args extends unknown[]>(
  fieldHandler: (...args: Args) => void,
  externalHandler?: (...args: Args) => void,
) {
  return callAll(fieldHandler, externalHandler);
}
