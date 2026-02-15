/**
 * Wix Dashboard - Supabase Edge Function
 *
 * This function serves as the dashboard that users see when they install
 * the JetSuite Blog Auto-Poster app on their Wix site.
 *
 * HOW IT WORKS:
 * 1. Receives instanceId query parameter from Wix
 * 2. Checks if user is already connected (looks up in database)
 * 3. Serves an HTML/React dashboard interface using HTM library
 * 4. Shows connection status, published posts, and settings
 *
 * QUERY PARAMETERS:
 * - instanceId: Unique identifier for the Wix app installation
 *
 * RESPONSE:
 * HTML page with embedded React components and Tailwind CSS
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { createSupabaseClient } from '../_shared/utils.ts';

// Environment variables
const WIX_CLIENT_ID = Deno.env.get('WIX_CLIENT_ID')!;
const WIX_REDIRECT_URI = Deno.env.get('WIX_REDIRECT_URI') || 'https://zcaxtyodksjtcpscasnw.supabase.co/functions/v1/wix-oauth-callback';
const APP_URL = Deno.env.get('APP_URL') || 'https://www.getjetsuite.com';

/**
 * Get connection and published posts for an instance
 */
async function getDashboardData(instanceId: string) {
  const supabase = createSupabaseClient();

  // Find connection by instanceId (stored in metadata)
  const { data: connections, error: connError } = await supabase
    .from('website_connections')
    .select('*')
    .eq('platform', 'wix')
    .eq('is_active', true);

  if (connError) {
    console.error('Error fetching connections:', connError);
    return { connection: null, posts: [] };
  }

  // Find connection with matching instanceId in metadata
  const connection = connections?.find((conn: any) =>
    conn.metadata?.instance_id === instanceId
  );

  if (!connection) {
    return { connection: null, posts: [] };
  }

  // Get recent published posts for this connection
  const { data: posts, error: postsError } = await supabase
    .from('blog_publications')
    .select('*')
    .eq('website_connection_id', connection.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(10);

  if (postsError) {
    console.error('Error fetching posts:', postsError);
    return { connection, posts: [] };
  }

  return { connection, posts: posts || [] };
}

/**
 * Generate the HTML dashboard
 */
function generateDashboard(
  instanceId: string,
  connection: any,
  posts: any[]
): string {
  const isConnected = !!connection;
  // Create a state parameter that encodes instanceId for OAuth callback
  // Format: wix_instance_{instanceId}_{random}
  const randomString = Math.random().toString(36).substring(2, 15);
  const oauthState = `wix_instance_${instanceId}_${randomString}`;
  const oauthUrl = `https://www.wix.com/oauth/authorize?client_id=${WIX_CLIENT_ID}&redirect_uri=${encodeURIComponent(WIX_REDIRECT_URI)}&response_type=code&scope=blog.posts.write&state=${oauthState}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JetSuite Blog Auto-Poster - Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="module">
    import { html, render } from 'https://esm.sh/htm@3.1.1/preact/standalone';

    // Dashboard state
    const state = {
      isConnected: ${isConnected},
      connection: ${JSON.stringify(connection)},
      posts: ${JSON.stringify(posts)},
      loading: false,
      error: null,
      settings: {
        autoPublish: true,
        publishMode: 'publish'
      }
    };

    // Main Dashboard Component
    function Dashboard() {
      const { isConnected, connection, posts, loading, error, settings } = state;

      return html\`
        <div class="min-h-screen bg-gray-900 text-gray-100">
          <!-- Header -->
          <header class="bg-gray-800 border-b border-gray-700 shadow-lg">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                  <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                    </svg>
                  </div>
                  <div>
                    <h1 class="text-2xl font-bold text-white">JetSuite Blog Auto-Poster</h1>
                    <p class="text-sm text-gray-400">Automated blog publishing for Wix</p>
                  </div>
                </div>
                <div class="flex items-center space-x-4">
                  <\${ConnectionStatus} isConnected=\${isConnected} connection=\${connection} />
                </div>
              </div>
            </div>
          </header>

          <!-- Main Content -->
          <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            \${error && html\`
              <div class="mb-6 bg-red-900/50 border border-red-700 rounded-lg p-4">
                <div class="flex items-center">
                  <svg class="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                  <p class="text-red-200">\${error}</p>
                </div>
              </div>
            \`}

            \${!isConnected && html\`
              <\${ConnectCard} oauthUrl="\${oauthUrl}" />
            \`}

            \${isConnected && html\`
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main content area -->
                <div class="lg:col-span-2 space-y-6">
                  <\${PublishedPosts} posts=\${posts} />
                  <\${APILogs} />
                </div>

                <!-- Sidebar -->
                <div class="space-y-6">
                  <\${SettingsPanel} connection=\${connection} settings=\${settings} />
                </div>
              </div>
            \`}
          </main>
        </div>
      \`;
    }

    // Connection Status Badge
    function ConnectionStatus({ isConnected, connection }) {
      if (!isConnected) {
        return html\`
          <div class="flex items-center space-x-2 px-3 py-1.5 bg-red-900/50 border border-red-700 rounded-full">
            <div class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span class="text-sm font-medium text-red-200">Not Connected</span>
          </div>
        \`;
      }

      return html\`
        <div class="flex items-center space-x-2 px-3 py-1.5 bg-green-900/50 border border-green-700 rounded-full">
          <div class="w-2 h-2 bg-green-500 rounded-full"></div>
          <span class="text-sm font-medium text-green-200">Connected to \${connection.site_name || 'Wix'}</span>
        </div>
      \`;
    }

    // Connect Card (shown when not connected)
    function ConnectCard({ oauthUrl }) {
      return html\`
        <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
          <div class="p-8 text-center">
            <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-white mb-3">Connect Your Wix Site</h2>
            <p class="text-gray-400 mb-8 max-w-md mx-auto">
              Connect your Wix site to start automatically publishing blog posts from JetSuite.
              You'll be able to choose your blog, set publish preferences, and track all your content.
            </p>
            <a
              href="\${oauthUrl}"
              class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Connect to Wix
            </a>
          </div>
        </div>
      \`;
    }

    // Published Posts Section
    function PublishedPosts({ posts }) {
      return html\`
        <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
            <h2 class="text-xl font-bold text-white flex items-center">
              <svg class="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Recently Published Posts
            </h2>
            <span class="text-sm text-gray-400">\${posts.length} posts</span>
          </div>
          <div class="divide-y divide-gray-700">
            \${posts.length === 0 ? html\`
              <div class="px-6 py-12 text-center">
                <svg class="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p class="text-gray-400">No posts published yet</p>
                <p class="text-sm text-gray-500 mt-2">Your published blog posts will appear here</p>
              </div>
            \` : posts.map(post => html\`
              <\${PostItem} post=\${post} key=\${post.id} />
            \`)}
          </div>
        </div>
      \`;
    }

    // Individual Post Item
    function PostItem({ post }) {
      const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      return html\`
        <div class="px-6 py-4 hover:bg-gray-750 transition-colors">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-white mb-1 truncate">
                \${post.title}
              </h3>
              <p class="text-sm text-gray-400 mb-2 line-clamp-2">
                \${post.excerpt || 'No excerpt available'}
              </p>
              <div class="flex items-center space-x-4 text-xs text-gray-500">
                <span class="flex items-center">
                  <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  \${publishedDate}
                </span>
                \${post.platform_post_url && html\`
                  <a
                    href="\${post.platform_post_url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="flex items-center text-blue-400 hover:text-blue-300"
                  >
                    <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    View on Wix
                  </a>
                \`}
              </div>
            </div>
            <div class="ml-4 flex-shrink-0">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-300 border border-green-700">
                Published
              </span>
            </div>
          </div>
        </div>
      \`;
    }

    // Settings Panel
    function SettingsPanel({ connection, settings }) {
      return html\`
        <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-700">
            <h2 class="text-xl font-bold text-white flex items-center">
              <svg class="w-5 h-5 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </h2>
          </div>
          <div class="px-6 py-4 space-y-4">
            <!-- Wix Site Info -->
            <div class="bg-gray-750 rounded-lg p-4">
              <h3 class="text-sm font-semibold text-gray-300 mb-2">Connected Site</h3>
              <p class="text-white font-medium">\${connection.site_name || 'Wix Site'}</p>
              <a href="\${connection.website_url}" target="_blank" class="text-sm text-blue-400 hover:text-blue-300 break-all">
                \${connection.website_url}
              </a>
            </div>

            <!-- Publish Mode -->
            <div>
              <label class="block text-sm font-semibold text-gray-300 mb-2">
                Publish Mode
              </label>
              <select class="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option value="publish" selected=\${settings.publishMode === 'publish'}>Publish Immediately</option>
                <option value="draft" selected=\${settings.publishMode === 'draft'}>Save as Draft</option>
              </select>
              <p class="text-xs text-gray-500 mt-1">Choose whether posts should be published immediately or saved as drafts</p>
            </div>

            <!-- Auto-Publish Toggle -->
            <div class="flex items-center justify-between">
              <div>
                <label class="block text-sm font-semibold text-gray-300">
                  Auto-Publish
                </label>
                <p class="text-xs text-gray-500 mt-1">Automatically publish new content</p>
              </div>
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 \${settings.autoPublish ? 'bg-blue-600' : 'bg-gray-600'}"
              >
                <span class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform \${settings.autoPublish ? 'translate-x-6' : 'translate-x-1'}"></span>
              </button>
            </div>

            <!-- Disconnect Button -->
            <div class="pt-4 border-t border-gray-700">
              <button class="w-full px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 font-medium rounded-lg border border-red-700 transition-colors">
                Disconnect Wix Site
              </button>
            </div>
          </div>
        </div>
      \`;
    }

    // API Logs Section
    function APILogs() {
      return html\`
        <div class="bg-gray-800 border border-gray-700 rounded-xl shadow-lg overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-700">
            <h2 class="text-xl font-bold text-white flex items-center">
              <svg class="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              API Activity
            </h2>
          </div>
          <div class="px-6 py-12 text-center">
            <svg class="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p class="text-gray-400">No recent API activity</p>
            <p class="text-sm text-gray-500 mt-2">API requests and responses will be logged here</p>
          </div>
        </div>
      \`;
    }

    // Render the app
    render(html\`<\${Dashboard} />\`, document.getElementById('app'));
  </script>
  <style>
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .animate-pulse {
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .bg-gray-750 {
      background-color: #2d3748;
    }
  </style>
</head>
<body class="bg-gray-900">
  <div id="app"></div>
</body>
</html>`;
}

serve(async (req: Request) => {
  const origin = req.headers.get('origin');

  try {
    console.log('=== Wix Dashboard Request ===');

    const url = new URL(req.url);
    const instanceId = url.searchParams.get('instanceId');

    // Validate instanceId
    if (!instanceId) {
      console.error('Missing instanceId parameter');
      return new Response(
        generateDashboard('', null, []),
        {
          status: 200,
          headers: {
            'Content-Type': 'text/html',
            ...getCorsHeaders(origin),
          },
        }
      );
    }

    console.log('Instance ID:', instanceId);

    // Get dashboard data
    const { connection, posts } = await getDashboardData(instanceId);

    console.log('Connection found:', !!connection);
    console.log('Posts count:', posts.length);

    // Generate and return HTML dashboard
    const html = generateDashboard(instanceId, connection, posts);

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Frame-Options': 'ALLOWALL', // Allow embedding in Wix iframe
        ...getCorsHeaders(origin),
      },
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    // Return error page
    const errorHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Error - JetSuite Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-900 text-gray-100 flex items-center justify-center min-h-screen">
  <div class="text-center">
    <div class="w-16 h-16 bg-red-900/50 rounded-full mx-auto mb-4 flex items-center justify-center">
      <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h1 class="text-2xl font-bold text-white mb-2">Something went wrong</h1>
    <p class="text-gray-400 mb-4">${errorMessage}</p>
    <a href="https://www.getjetsuite.com" class="text-blue-400 hover:text-blue-300">Return to JetSuite</a>
  </div>
</body>
</html>`;

    return new Response(errorHtml, {
      status: 500,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        ...getCorsHeaders(origin),
      },
    });
  }
});
