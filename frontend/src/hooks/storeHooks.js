import { useDispatch, useSelector } from "react-redux";
/**
 * Typed version of useDispatch.
 *
 * Use this instead of the raw useDispatch hook so that actions
 * are typed correctly against the application's store.
 */
export const useAppDispatch = () => useDispatch();
/**
 * Typed version of useSelector.
 *
 * Use this instead of the raw useSelector hook so that state
 * selectors are typed correctly against the application's RootState.
 */
export const useAppSelector = useSelector;
