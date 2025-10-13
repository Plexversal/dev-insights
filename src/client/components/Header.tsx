import { navigateTo } from "@devvit/web/client";

export default function Header() {

  return (
      <header className="w-full max-w-2xl flex max-[600px]:flex-col max-[600px]:justify-center justify-between items-center text-[0.75em] text-gray-600 max-[600px]:gap-2">
        <p className="max-[600px]:hidden">
          <strong>Community Insights</strong>
        </p>
        <div className="flex gap-3 items-center transition-colors">
          <p className="min-[601px]:hidden">
            <strong>Community Insights</strong>
          </p>
          <span className="min-[601px]:hidden text-gray-300">|</span>
          <button
            className="cursor-pointer hover:underline hover:text-gray-700"
            onClick={() => navigateTo('https://developers.reddit.com/apps/dev-insights')}
          >
            Add to my subreddit
          </button>
          <span className="text-gray-300">|</span>
          <button
            className="cursor-pointer hover:underline hover:text-gray-700"
            onClick={() => navigateTo(`https://www.reddit.com/message/compose/?to=PlexversalHD&subject=${encodeURIComponent('Report issue with Dev-Insights app')}`)}
          >
            Report an issue
          </button>
        </div>

      </header>
  )

}
