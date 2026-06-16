'use client'

import { useEffect } from 'react'

const SWAGGER_VERSION = '5.18.2'

/**
 * Renders Swagger UI for the OpenAPI spec served at /api/openapi.
 * Swagger UI assets are loaded from a CDN to avoid bundling a React-version
 * sensitive package.
 */
export default function ApiDocsPage() {
  useEffect(() => {
    const css = document.createElement('link')
    css.rel = 'stylesheet'
    css.href = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui.css`
    document.head.appendChild(css)

    const script = document.createElement('script')
    script.src = `https://unpkg.com/swagger-ui-dist@${SWAGGER_VERSION}/swagger-ui-bundle.js`
    script.crossOrigin = 'anonymous'
    script.onload = () => {
      // SwaggerUIBundle is attached to window by the CDN script.
      ;(window as unknown as { SwaggerUIBundle: (o: object) => void }).SwaggerUIBundle({
        url: '/api/openapi',
        domNode: document.getElementById('swagger-ui'),
        deepLinking: true,
      })
    }
    document.body.appendChild(script)

    return () => {
      css.remove()
      script.remove()
    }
  }, [])

  return (
    <div className="min-h-full bg-white">
      <div id="swagger-ui" />
    </div>
  )
}
