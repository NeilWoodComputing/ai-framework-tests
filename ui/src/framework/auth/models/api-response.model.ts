export interface ApiResponseErrorMessage {
  message: string;
  httpStatusCode: number;
  statusCode: string;
}

export interface ApiResponse {
  success: boolean;
  errorMessages: ApiResponseErrorMessage[];
  statusCode: number;
}
