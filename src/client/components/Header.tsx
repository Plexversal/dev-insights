import { navigateTo } from "@devvit/web/client";

export default function Header() {

  return (
      <header className="w-full max-w-2xl flex justify-between items-center text-[0.75em] text-gray-600">
        <p>
          <strong>Community Insights</strong>
        </p>
        <div className="flex gap-3 transition-colors">
          <button
            className="cursor-pointer hover:underline hover:text-gray-700"
            onClick={() => navigateTo('https://developers.reddit.com/apps/dev-insights')}
          >
            Add to my subreddit
          </button>
        </div>

      </header>
  )

}
