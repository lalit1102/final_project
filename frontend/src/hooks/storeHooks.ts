import { useDispatch, useSelector } from "react-redux";
import type { TypedUseSelectorHook } from "react-redux";

import type { AppDispatch, RootState } from "@/store";

/**
 * Typed version of useDispatch.
 *
 * Use this instead of the raw useDispatch hook so that actions
 * are typed correctly against the application's store.
 */
export const useAppDispatch = (): AppDispatch => useDispatch<AppDispatch>();

/**
 * Typed version of useSelector.
 *
 * Use this instead of the raw useSelector hook so that state
 * selectors are typed correctly against the application's RootState.
 */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
