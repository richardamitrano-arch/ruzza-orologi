import { shopifyHandoff } from './_shopify-handoff.js'

export function onRequestGet({ request, env }) {
  return shopifyHandoff(request, env, '/contact')
}

export function onRequestPost({ request, env }) {
  return shopifyHandoff(request, env, '/contact')
}
