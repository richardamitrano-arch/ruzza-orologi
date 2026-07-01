import { shopifyHandoff } from '../_shopify-handoff.js'

export function onRequestGet({ request, env }) {
  return shopifyHandoff(request, env, '/pages/privacy-policy')
}
