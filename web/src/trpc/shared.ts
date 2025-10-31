import { type RouterOutputs } from "./react";

export type ItemDto = RouterOutputs["item"]["getById"];
export type ItemListDto = RouterOutputs["item"]["getBySearchId"];
export type SearchWithStatsList = RouterOutputs["search"]["getUserSearches"];
