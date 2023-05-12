export async function fetchViewer() {
  const query = `{
    viewer {
      id
    }
  }`
  const data = await sendQuery(query)
  return data?.viewer
}

async function sendQuery(query: string, variables: Record<string, any> = {}) {
  const res = await fetch('https://api.chainjet.io/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage['chainjet.token']}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) {
    throw new Error(json.errors[0].message)
  }
  return json?.data
}
