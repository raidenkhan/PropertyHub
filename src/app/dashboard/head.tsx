export default function Head() {
  return (
    <>
      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      
      {/* DNS prefetch for external domains */}
      <link rel="dns-prefetch" href="https://images.unsplash.com" />
      <link rel="dns-prefetch" href="https://api.example.com" />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://images.unsplash.com" crossOrigin="anonymous" />
      
      {/* Resource hints for critical CSS */}
      <link rel="preload" href="/css/dashboard.css" as="style" />
      
      <title>Dashboard - PropertyHub</title>
      <meta name="description" content="Manage your properties, track purchases, and stay updated with PropertyHub dashboard" />
      
      {/* Prevent layout shift with viewport meta */}
      <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      
      {/* Optimize for performance */}
      <meta httpEquiv="x-dns-prefetch-control" content="on" />
    </>
  )
}