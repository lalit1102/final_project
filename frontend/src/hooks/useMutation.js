import { useState, useCallback } from "react";
export function useMutation(serviceFn) {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setLoading] = useState(false);
    const [isSuccess, setSuccess] = useState(false);
    const execute = useCallback(async (...args) => {
        setLoading(true);
        setError(null);
        setSuccess(false);
        setData(null);
        try {
            const result = await serviceFn(...args);
            setData(result);
            setSuccess(true);
            return result;
        }
        catch (err) {
            setError(err);
            return undefined;
        }
        finally {
            setLoading(false);
        }
    }, [serviceFn]);
    return {
        execute,
        data,
        error,
        isLoading,
        isSuccess,
        isError: error !== null,
    };
}
