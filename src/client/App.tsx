import { useInit } from './hooks/useInit';
import { CommentDisplay } from './components/CommentDisplay';
import Footer from './components/Footer';

export const App = () => {
  const { username, postId } = useInit();

  console.log(`[App] Current postId: ${postId}`);
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold text-center text-gray-900 ">
          {username ? `Hey ${username} 👋` : ''}
        </h1>
      </div>

      {/* Comments Section */}
      <CommentDisplay postId={postId} />

      <Footer />
    </div>
  );
};
