import { NextResponse } from 'next/server'
import { openApiSpec } from '@/lib/openapi'

export const dynamic = 'force-static'

// Serves the OpenAPI document consumed by Swagger UI at /docs.
export function GET() {
  return NextResponse.json(openApiSpec)
}
