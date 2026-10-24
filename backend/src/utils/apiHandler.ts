import { NextRequest, NextResponse } from "next/server";

export function apiHandler(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async function wrappedHandler(req: NextRequest) {
    try {
      return await handler(req);
    } catch (error) {
      console.error("API handler error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Internal Server Error",
          data: null,
          errors: ["Internal Server Error"],
        },
        { status: 500 }
      );
    }
  };
}
