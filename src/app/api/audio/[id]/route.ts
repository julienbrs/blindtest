import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // Placeholder - will be implemented in Epic 3
  return NextResponse.json({ error: 'Not implemented', id }, { status: 501 })
}
