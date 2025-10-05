import { navigateTo } from "@devvit/web/client";

export default function Footer() {

  return (
      <footer className="flex justify-center items-center gap-3 my-2 text-[0.8em] text-gray-600 hover:text-gray-700 transition-all">
        <button
          className="cursor-pointer"
          onClick={() => navigateTo('https://developers.reddit.com/apps/dev-insights')}
        >
          Add to my subreddit
        </button>
        <span className="text-gray-300">|</span>
        <button
          className="cursor-pointer"
          onClick={() => navigateTo(`https://www.reddit.com/message/compose/?to=PlexversalHD&subject=${encodeURIComponent('Report issue with Dev-Insights app')}`)}
        >
          Report an issue
        </button>
      </footer>
  )

}
