import { NextRequest } from "next/server";
import { listAvailability } from "@/lib/data";

export async function GET(request: NextRequest) {
  const doctorId = request.nextUrl.searchParams.get("doctorId");
  const date = request.nextUrl.searchParams.get("date");

  if (!doctorId || !date) {
    return Response.json(
      { error: "doctorId and date are required." },
      { status: 400 },
    );
  }

  return Response.json({
    doctorId,
    date,
    slots: await listAvailability(doctorId, date),
  });
}
