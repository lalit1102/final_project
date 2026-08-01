import type { AxiosError } from "axios";

interface ErrorResponseShape {
  message?: string;
  errors?: string[];
}

export const getApiValidationErrors = (error: unknown): string[] => {
  if (error && typeof error === "object") {
    const axiosError = error as AxiosError<ErrorResponseShape>;
    const validationErrors = axiosError.response?.data?.errors;

    if (validationErrors && validationErrors.length > 0) {
      return validationErrors;
    }

    const responseMessage = axiosError.response?.data?.message;
    if (responseMessage) {
      return [responseMessage];
    }
  }

  return [];
};

export const getApiErrorMessage = (error: unknown): string => {
  const validationErrors = getApiValidationErrors(error);
  if (validationErrors.length > 0) {
    return validationErrors.join(" ");
  }

  if (typeof error === "string" && error.trim().length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    const axiosError = error as AxiosError<ErrorResponseShape>;
    if (axiosError.message) {
      return axiosError.message;
    }
  }

  return "Something went wrong. Please try again.";
};
