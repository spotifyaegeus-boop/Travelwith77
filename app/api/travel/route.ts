import {NextResponse} from 'next/server';import {getTravelData} from '../../../lib/travel';export async function GET(){return NextResponse.json(await getTravelData())}
