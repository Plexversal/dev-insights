import { useInit } from './hooks/useInit';
import { PostDisplay } from './components/PostDisplay';
import { CommentDisplay } from './components/CommentDisplay';
import Footer from './components/Footer';

export const App = () => {
  const { username, postId } = useInit();

  console.log(`[App] Current postId: ${postId}`);
  return (
    <div className="flex relative flex-col justify-center items-center min-h-screen gap-4 bg-white p-[4px]">


      {/* Posts Section */}
      <PostDisplay postId={postId} />

      {/* Comments Section */}
      <CommentDisplay postId={postId} />

      <Footer />
    </div>
  );
};
