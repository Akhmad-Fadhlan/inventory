import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

const API_URL = process.env.SISMA_API_URL;

/**
 * Proxy handler: forwards requests to SISMA GAS backend.
 * Avoids CORS issues by making server-to-server calls.
 * Attaches SISMA JWT from NextAuth session automatically.
 */
async function handleProxy(request) {
  try {
    const session = await getServerSession(authOptions);
    const url = new URL(request.url);

    const endpoint = url.searchParams.get('endpoint');
    if (!endpoint) {
      return NextResponse.json(
        { success: false, message: 'Parameter endpoint diperlukan.' },
        { status: 400 }
      );
    }

    // Build GAS target URL
    const gasUrl = new URL(API_URL);
    gasUrl.searchParams.set('path', endpoint);

    // Forward all query params except 'endpoint'
    url.searchParams.forEach((value, key) => {
      if (key !== 'endpoint') {
        gasUrl.searchParams.set(key, value);
      }
    });

    // Attach SISMA JWT token
    if (session?.sismaToken) {
      gasUrl.searchParams.set('token', session.sismaToken);
    }

    // Determine actual HTTP method for GAS
    const method = request.method;
    let gasMethod = 'GET';
    let body = undefined;

    if (method === 'POST') {
      gasMethod = 'POST';
      try { body = await request.json(); } catch {}
    } else if (method === 'PUT') {
      gasMethod = 'POST';
      gasUrl.searchParams.set('method', 'PUT');
      try { body = await request.json(); } catch {}
    } else if (method === 'DELETE') {
      gasMethod = 'POST';
      gasUrl.searchParams.set('method', 'DELETE');
    }

    const fetchOptions = {
      method: gasMethod,
      redirect: 'follow',
    };

    if (body) {
      fetchOptions.headers = { 'Content-Type': 'application/json' };
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(gasUrl.toString(), fetchOptions);
    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: false, message: 'Invalid response from backend', raw: text.substring(0, 200) };
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { success: false, message: `Proxy error: ${error.message}` },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  return handleProxy(request);
}

export async function POST(request) {
  return handleProxy(request);
}

export async function PUT(request) {
  return handleProxy(request);
}

export async function DELETE(request) {
  return handleProxy(request);
}
