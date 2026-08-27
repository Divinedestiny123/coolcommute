import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const stats = db.prepare('SELECT * FROM stats ORDER BY id DESC LIMIT 1').get();
    const islands = db.prepare('SELECT * FROM heat_islands').all();

    return NextResponse.json({
      stats,
      islands
    });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { action } = await request.json();
    
    if (action === 'increment_routes') {
      db.prepare('UPDATE stats SET routes_calculated = routes_calculated + 1, citizens_rerouted = citizens_rerouted + 1').run();
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 });
  }
}
