import { useInit } from './hooks/useInit';
import { PostDisplay } from './components/PostDisplay';
import { CommentDisplay } from './components/CommentDisplay';
import Footer from './components/Footer';
import Header from './components/Header';

export const App = () => {
  const { username, postId } = useInit();

  console.log(`[App] Current postId: ${postId}`);
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4 bg-white dark:bg-black p-2">
      <Header />

      {/* Posts Section */}
      <PostDisplay postId={postId} />

      {/* Comments Section */}
      <CommentDisplay postId={postId} />

      <Footer />
    </div>
  );
};
