// import { NextRequest, NextResponse } from "next/server";
// import { search } from "aishe-institutions-list";

// export async function GET(req: NextRequest) {
//   const query = req.nextUrl.searchParams.get("search") ?? "";

//   if (!query || query.length < 3) {
//     return NextResponse.json({ colleges: [] });
//   }

//   const results = search(query).slice(0, 10);
//   return NextResponse.json({ colleges: results });
// }