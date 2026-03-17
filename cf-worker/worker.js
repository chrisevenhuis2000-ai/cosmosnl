export default {
  async fetch(request) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin':  'https://stargazing.crixium.net',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version',
          'Access-Control-Max-Age':       '86400',
        }
      })
    }

    // Forward naar Anthropic
    const body = await request.json()
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type':                'application/json',
        'Access-Control-Allow-Origin': 'https://stargazing.crixium.net',
      }
    })
  }
}
