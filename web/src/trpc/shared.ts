import { type RouterOutputs } from "./react";

export type Item = RouterOutputs["item"]["getById"];
export type ItemList = RouterOutputs["item"]["getAll"];
export type SearchList = RouterOutputs["search"]["getUserSearches"];
